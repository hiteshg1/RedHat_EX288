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
oc adm policy add-role-to-user edit developer -n cicd
oc policy add-role-to-user system:image-builder -z pipeline -n cicd
oc policy add-role-to-user edit -z pipeline -n cicd
oc get serviceaccount pipeline -n cicd
```

## 1. Create the public source repository

Create `https://gitlab.com/hits.govind/pipeline-app.git` with default branch `main`. Clone it locally and add these files.

`Containerfile`:

```dockerfile
FROM registry.access.redhat.com/ubi9/python-311:latest
WORKDIR /opt/app-root/src
COPY --chown=1001:0 index.html ./index.html
EXPOSE 8080
CMD ["python3", "-m", "http.server", "8080"]
```

`index.html`:

```html
Hello, Pipelines!
```

Commit and push to `main`.

## 2. Log in as the learner

```bash
oc login -u developer -p developer https://api.crc.testing:6443
oc project cicd
```

## 3. Create the Pipeline

Save as `pipeline.yaml`:

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

## 4. Start a manual run

Save as `manual-run.yaml`:

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

## 5. Create trigger RBAC

Save as `trigger-rbac.yaml`:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: pipeline-trigger-sa
---
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
```

```bash
oc apply -f trigger-rbac.yaml
```

## 6. Create the trigger resources

Save as `triggers.yaml`:

```yaml
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
        generateName: build-and-deploy-trigger-
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
oc apply -f triggers.yaml
oc expose service el-pipeline-app-listener
EL_ROUTE=$(oc get route el-pipeline-app-listener -o jsonpath='{.spec.host}')
```

## 7. Repeatable local trigger test

Use this on the Fedora host to validate Tekton triggers in the private CRC lab:

```bash
curl --noproxy '*' -X POST "http://${EL_ROUTE}" \
  -H 'Content-Type: application/json' \
  -d '{"checkout_sha":"main","project":{"git_http_url":"https://gitlab.com/hits.govind/pipeline-app.git"}}'
oc get pipelinerun -w
```

For a real GitLab webhook, first ensure the GitLab server can reach the EventListener route. A private CRC route is normally not reachable from GitLab.com.

## 8. Practice again

Each manual or trigger-created run receives a new PVC, so runs do not overwrite one another. For a clean application reset:

```bash
oc delete pipelinerun --all
oc delete deployment,service,route pipeline-app --ignore-not-found
```
