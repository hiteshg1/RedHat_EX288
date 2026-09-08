# Question 10 solution: Repeatable CRC Pipeline Lab

This solution uses `oc` only. The optional `tkn` client is not required.

## 0. Administrator stop/go check

Log in as `kubeadmin` or `admin` and run:

```bash
oc get csv -n openshift-operators | grep -i pipelines
oc get tektonconfig
oc get pods -n openshift-pipelines
oc get task -n openshift-pipelines
oc get task -A
oc get stepaction -n openshift-pipelines
```

Do not continue until the `openshift-pipelines` namespace contains `git-clone`, `buildah`, and `openshift-client`. An empty namespace means the Operator installation/configuration must be repaired by an administrator.

Then provision the lab project:

```bash
oc new-project cicd 2>/dev/null || true
oc create serviceaccount pipeline -n cicd 2>/dev/null || true
oc adm policy add-role-to-user edit developer -n cicd
oc policy add-role-to-user system:image-builder -z pipeline -n cicd
oc policy add-role-to-user edit -z pipeline -n cicd
oc get serviceaccount pipeline -n cicd
oc auth can-i use securitycontextconstraints/pipelines-scc \
  --as=system:serviceaccount:cicd:pipeline
```

The final command must return `yes`. If it returns `no`, an administrator must grant the SCC and repeat the check:

```bash
oc adm policy add-scc-to-user pipelines-scc -z pipeline -n cicd
```

## 1. Create the public source repository: mandatory

This step must complete before creating any Pipeline resources.

1. In GitLab, create a **blank** project:

   - Namespace: `hits.govind`
   - Project name: `pipeline-app`
   - Visibility: **Public**
   - Do **not** initialize the repository with a README, `.gitignore`, or licence.

2. Create the local repository and set its branch explicitly to `main`:

```bash
mkdir -p ~/gitlab/pipeline-app
cd ~/gitlab/pipeline-app
git init -b main
```

3. Create the following two files.

`Containerfile`:

```dockerfile
cat > Containerfile <<'EOF'
FROM registry.access.redhat.com/ubi9/python-311:latest
WORKDIR /opt/app-root/src
COPY --chown=1001:0 index.html ./index.html
EXPOSE 8080
CMD ["python3", "-m", "http.server", "8080"]
EOF
```

`index.html`:

```bash
cat > index.html <<'EOF'
Hello, Pipelines!
EOF
```

4. Commit and push the files:

```bash
git add Containerfile index.html
git commit -m "Add pipeline application"
git remote add origin https://gitlab.com/hits.govind/pipeline-app.git
git push -u origin main
```

5. Confirm the exact branch is available before continuing:

```bash
git ls-remote https://gitlab.com/hits.govind/pipeline-app.git refs/heads/main
```

The command must print a commit hash and `refs/heads/main`. If it does not, do not create a PipelineRun.

## 2. Optional reset before a new practice attempt

If you want a completely clean OpenShift attempt, delete the existing project as an administrator and wait for it to disappear:

```bash
oc delete project cicd
oc get project cicd
```

When the second command returns `NotFound`, restart at **Administrator stop/go check**. Do not delete the GitLab repository; it is the reusable source input for every practice run.

After the administrator preparation, the learner must recreate the Pipeline **before** creating any PipelineRun:

```bash
oc login -u developer -p developer https://api.crc.testing:6443
oc project cicd
oc apply -f pipeline.yaml
oc get pipeline build-and-deploy
```

Only after `oc get pipeline build-and-deploy` succeeds may the learner run `oc create -f manual-run.yaml`.

If retaining the project instead of deleting it, remove old runs and their claims only when `cicd` is dedicated to this lab:

```bash
oc delete pipelinerun --all
oc delete pvc --all
```

## 3. Log in as the learner

```bash
oc login -u developer -p developer https://api.crc.testing:6443
oc project cicd
```

## 4. Create the Pipeline

Create file `pipeline.yaml`:

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: build-and-deploy
spec:
  params:
    - name: git-url
      type: string
      default: https://gitlab.com/hits.govind/pipeline-app.git
    - name: git-revision
      type: string
      default: main
    - name: image
      type: string
      default: image-registry.openshift-image-registry.svc:5000/cicd/pipeline-app:latest
    - name: app-host
      type: string
      default: pipeline-app-cicd.apps-crc.testing
  workspaces:
    - name: shared-data
  tasks:
    - name: fetch-repository
      taskRef:
        resolver: cluster
        params:
          - name: kind
            value: task
          - name: name
            value: git-clone
          - name: namespace
            value: openshift-pipelines
      params:
        - name: URL
          value: $(params.git-url)
        - name: REVISION
          value: $(params.git-revision)
        - name: DELETE_EXISTING
          value: "true"
      workspaces:
        - name: output
          workspace: shared-data
    - name: build-image
      runAfter: [fetch-repository]
      taskRef:
        resolver: cluster
        params:
          - name: kind
            value: task
          - name: name
            value: buildah
          - name: namespace
            value: openshift-pipelines
      params:
        - name: IMAGE
          value: $(params.image)
        - name: DOCKERFILE
          value: ./Containerfile
        - name: TLSVERIFY
          value: "false"
      workspaces:
        - name: source
          workspace: shared-data
    - name: deploy
      runAfter: [build-image]
      taskRef:
        resolver: cluster
        params:
          - name: kind
            value: task
          - name: name
            value: openshift-client
          - name: namespace
            value: openshift-pipelines
      params:
        - name: SCRIPT
          value: |
            oc create deployment pipeline-app --image=$(params.image) --dry-run=client -o yaml | oc apply -f -
            oc set image deployment/pipeline-app pipeline-app=$(params.image)
            oc expose deployment/pipeline-app --port=8080 --dry-run=client -o yaml | oc apply -f -
            oc expose service/pipeline-app --hostname=$(params.app-host) --dry-run=client -o yaml | oc apply -f -
            oc rollout restart deployment/pipeline-app
            oc rollout status deployment/pipeline-app --timeout=180s
```

```bash
oc apply -f pipeline.yaml
```

## 5. Start a manual run

Create file `manual-run.yaml`:

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  generateName: build-and-deploy-manual-
spec:
  pipelineRef:
    name: build-and-deploy
  taskRunTemplate:
    serviceAccountName: pipeline
  workspaces:
    - name: shared-data
      volumeClaimTemplate:
        spec:
          accessModes: [ReadWriteOnce]
          resources:
            requests:
              storage: 1Gi
```

```bash
oc create -f manual-run.yaml
oc get pipelinerun -w
oc get pods,route
curl --noproxy '*' http://pipeline-app-cicd.apps-crc.testing
```

## 6. Create trigger RBAC: administrator action

The developer prepares this file but must **not** apply it. The following commands in this section are run by `admin` or `kubeadmin` only.

Create file `trigger-rbac.yaml`:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pipeline-trigger-run-creator
rules:
  - apiGroups: ["tekton.dev"]
    resources: ["pipelineruns"]
    verbs: ["create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: pipeline-trigger-run-creator
subjects:
  - kind: ServiceAccount
    name: pipeline-trigger-sa
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: pipeline-trigger-run-creator
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: pipeline-trigger-listener
subjects:
  - kind: ServiceAccount
    name: pipeline-trigger-sa
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: tekton-triggers-eventlistener-roles
---
# ClusterInterceptors are cluster-scoped. This binding is therefore an
# administrator-only resource.
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cicd-pipeline-trigger-listener-cluster
subjects:
  - kind: ServiceAccount
    name: pipeline-trigger-sa
    namespace: cicd
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: tekton-triggers-eventlistener-clusterroles
```

```bash
# Administrator only: first confirm this is not the developer session.
oc whoami
# Expected: admin or kubeadmin
oc project cicd
oc apply -f trigger-rbac.yaml -n cicd
oc get role pipeline-trigger-run-creator -n cicd
oc get rolebinding pipeline-trigger-run-creator pipeline-trigger-listener -n cicd
oc get clusterrolebinding cicd-pipeline-trigger-listener-cluster
```

Only an administrator applies this file. The EventListener ServiceAccount is deliberately not in this file: the developer creates it in the next step.

After this succeeds, log in as `developer`, confirm the identity, and continue:

```bash
oc login -u developer -p developer https://api.crc.testing:6443
oc project cicd
oc whoami
# Expected: developer
```

## 7. Create the trigger resources as developer

Create file  `triggers.yaml`:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: pipeline-trigger-sa
---
apiVersion: triggers.tekton.dev/v1beta1
kind: TriggerBinding
metadata:
  name: pipeline-app-binding
spec:
  params:
    - name: git-url
      value: $(body.project.git_http_url)
    - name: git-revision
      value: $(body.checkout_sha)
---
apiVersion: triggers.tekton.dev/v1beta1
kind: TriggerTemplate
metadata:
  name: pipeline-app-template
spec:
  params:
    - name: git-url
    - name: git-revision
  resourcetemplates:
    - apiVersion: tekton.dev/v1
      kind: PipelineRun
      metadata:
        generateName: build-and-deploy-webhook-
      spec:
        pipelineRef:
          name: build-and-deploy
        taskRunTemplate:
          serviceAccountName: pipeline
        params:
          - name: git-url
            value: $(tt.params.git-url)
          - name: git-revision
            value: $(tt.params.git-revision)
        workspaces:
          - name: shared-data
            volumeClaimTemplate:
              spec:
                accessModes: [ReadWriteOnce]
                resources:
                  requests:
                    storage: 1Gi
---
apiVersion: triggers.tekton.dev/v1beta1
kind: EventListener
metadata:
  name: pipeline-app-listener
spec:
  serviceAccountName: pipeline-trigger-sa
  triggers:
    - name: gitlab-push
      bindings:
        - ref: pipeline-app-binding
      template:
        ref: pipeline-app-template
```

```bash
# Developer only: the administrator must have applied trigger-rbac.yaml first.
oc whoami
# Expected: developer
oc apply -f triggers.yaml
oc get serviceaccount pipeline-trigger-sa
oc get triggerbinding,triggertemplate,eventlistener
oc get pods -l eventlistener=pipeline-app-listener -w
# Continue only when the pod reports 1/1 Running. Press Ctrl+C to stop watching.
oc expose service el-pipeline-app-listener --dry-run=client -o yaml | oc apply -f -
EL_ROUTE=$(oc get route el-pipeline-app-listener -o jsonpath='{.spec.host}')
```

## 8. Repeatable local trigger test

Use this on the Fedora host to validate Tekton triggers in the private CRC lab:

```bash
curl --noproxy '*' -X POST "http://${EL_ROUTE}" \
  -H 'Content-Type: application/json' \
  -d '{"checkout_sha":"main","project":{"git_http_url":"https://gitlab.com/hits.govind/pipeline-app.git"}}'

oc get pipelinerun -w
```

The EventListener returns `202 Accepted` for a valid payload. A new PipelineRun whose name begins with `build-and-deploy-webhook-` should then appear.

For a real GitLab webhook, first ensure the GitLab server can reach the EventListener route. A private CRC route is normally not reachable from GitLab.com.

## 9. Practice again

Each manual or trigger-created run receives a new PVC, so runs do not overwrite one another. For a clean application reset:

```bash
oc delete pipelinerun --all
oc delete deployment,service,route pipeline-app --ignore-not-found
```
