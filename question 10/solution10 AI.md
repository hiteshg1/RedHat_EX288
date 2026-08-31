# Question 10 solution: Repeatable CRC Pipeline Lab

## 1. One-time source repository preparation

Create a public repository at `https://gitlab.com/hits.govind/pipeline-app.git` (or replace this URL consistently below with a Git server reachable both by the build pod and the webhook sender). Ensure its default branch is `main` and add:

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

## 2. Log in and select the project

```bash
oc login -u developer -p developer https://api.crc.testing:6443
oc project cicd
```

## 3. Create the Pipeline

Save the following as `pipeline.yaml` and apply it. The task names and parameter names must be checked against the installed Pipelines version before use:

```bash
tkn task describe git-clone -n openshift-pipelines
tkn task describe buildah -n openshift-pipelines
tkn task describe openshift-client -n openshift-pipelines
```

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

## 4. Run it manually

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
tkn pipelinerun logs -f --last
```

Verify:

```bash
oc get pipelinerun,pods,route
curl --noproxy '*' http://pipeline-app-cicd.apps-crc.testing
```

## 5. Configure Trigger RBAC

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

## 6. Create the trigger objects

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
echo "$EL_ROUTE"
```

## 7. Repeatable local trigger test

This works in the private CRC lab and validates the TriggerBinding, TriggerTemplate, EventListener, and PipelineRun creation:

```bash
curl --noproxy '*' -X POST "http://${EL_ROUTE}" \
  -H 'Content-Type: application/json' \
  -d '{"checkout_sha":"main","project":{"git_http_url":"https://gitlab.com/hits.govind/pipeline-app.git"}}'
oc get pipelinerun -w
```

## 8. GitLab webhook (only after reachability is proven)

Before creating a GitLab.com webhook, verify that GitLab can reach `http://${EL_ROUTE}`. A private CRC address normally fails this test. If the route is made reachable through approved infrastructure, configure the GitLab project webhook with that URL and enable **Push events**.

## 9. Repeat the lab

To practice again, push a change or rerun the local trigger test. Each run receives its own PVC, so concurrent runs do not overwrite each other. To remove only the generated application and runs:

```bash
oc delete pipelinerun --all
oc delete deployment,service,route pipeline-app --ignore-not-found
```

Keep the Pipeline and trigger objects for the next practice run.
