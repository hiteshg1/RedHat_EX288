# Question 10: Repeatable OpenShift Pipelines Lab for CRC

## Administrator preparation: complete once

This lab targets `api.crc.testing` and the `apps-crc.testing` ingress domain.

1. Confirm the Red Hat OpenShift Pipelines Operator is healthy and has installed its required Tasks:

```bash
oc get csv -n openshift-operators | grep -i pipelines
oc get tektonconfig
oc get pods -n openshift-pipelines
oc get task -n openshift-pipelines
```

Proceed only if the CSV is `Succeeded`, the pods are healthy, and the last command lists `git-clone`, `buildah`, and `openshift-client`.

If it says `No resources found`, stop. The learner must not continue. Investigate as an administrator:

```bash
oc get task -A
oc get stepaction -n openshift-pipelines
oc get deployment -n openshift-pipelines
oc get csv -n openshift-operators | grep -i pipelines
```

Do not use unpinned task YAML from the internet as an ad-hoc substitute.

2. Create the project and grant only lab-scoped access:

```bash
oc new-project cicd 2>/dev/null || true
oc adm policy add-role-to-user edit developer -n cicd
oc policy add-role-to-user system:image-builder -z pipeline -n cicd
oc policy add-role-to-user edit -z pipeline -n cicd
oc get serviceaccount pipeline -n cicd
```

The `pipeline` service account can appear shortly after project creation; role bindings created before it appears still reference the correct identity.

3. Webhook reachability is an explicit prerequisite. A GitLab.com webhook cannot reach a private CRC route. Use an internal GitLab instance, approved public ingress/tunnel, or the local HTTP trigger test in the solution.

## Learner task

Create a repeatable CI/CD workflow in `cicd` for a public repository containing `Containerfile` and `index.html`.

- Create `Pipeline/build-and-deploy`.
- Use one PVC-backed workspace, `shared-data`, for each PipelineRun.
- Run `fetch-repository` with `git-clone`, then `build-image` with `buildah`, then `deploy` with `openshift-client`.
- Push `pipeline-app:latest` to `image-registry.openshift-image-registry.svc:5000/cicd`.
- Create a manual PipelineRun and webhook-triggered PipelineRuns.
- Make the application available at `http://pipeline-app-cicd.apps-crc.testing` and return `Hello, Pipelines!`.

The clone and build tasks share the source workspace. Deployment consumes the image and does not need the workspace.
