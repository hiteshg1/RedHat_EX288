# Question 10: Build and Deploy with OpenShift Pipelines and Triggers

## Administrator preparation (complete once)

This lab targets the CRC cluster at `api.crc.testing` and its `apps-crc.testing` ingress domain.

1. Confirm that Red Hat OpenShift Pipelines is installed and that its shipped tasks are resolvable:

```bash
oc get csv -n openshift-operators | grep -i pipelines
oc get task -n openshift-pipelines | grep -E 'git-clone|buildah|openshift-client'
```

If these tasks are unavailable, install or upgrade OpenShift Pipelines before continuing. This lab does not support substituting task versions without validating their parameters.

2. Create the project and give the learner project-scoped access:

```bash
oc new-project cicd 2>/dev/null || true
oc adm policy add-role-to-user edit developer -n cicd
oc policy add-role-to-user system:image-builder -z pipeline -n cicd
oc policy add-role-to-user edit -z pipeline -n cicd
```

3. Confirm the pipeline service account exists:

```bash
oc get serviceaccount pipeline -n cicd
```

4. Decide how webhooks reach the cluster. A GitLab.com webhook cannot reach a private CRC route unless the route is publicly reachable. Choose one:

   - use an internal GitLab server that can reach the CRC ingress;
   - expose the EventListener through an approved public ingress or tunnel; or
   - use the local HTTP trigger test in this lab. It proves the Tekton trigger chain, but it is not a Git push.

## Learner task

Using a public Git repository that contains `Containerfile` and `index.html`, create a repeatable CI/CD workflow in project `cicd`.

- Create a Pipeline named `build-and-deploy`.
- Use one workspace named `shared-data`, backed by a PVC for each PipelineRun.
- Run `fetch-repository`, then `build-image`, then `deploy`.
- Clone the source with `git-clone` and build/push `pipeline-app:latest` to the integrated registry using `buildah`.
- Deploy an application named `pipeline-app` with `openshift-client`.
- Start a successful manual PipelineRun.
- Create a TriggerBinding, TriggerTemplate, and EventListener that create a new PipelineRun from a GitLab-style push payload.
- Verify the application at `http://pipeline-app-cicd.apps-crc.testing` returns `Hello, Pipelines!`.

The workspace is shared by the clone and build tasks within one run. The deploy task consumes the built image; it does not require the source workspace.
