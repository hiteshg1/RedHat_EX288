# Build customization and post-commit hooks

## What It Is

A BuildConfig is the reusable recipe; a Build records a particular attempt. The hook runs against the output image in a temporary container. Its working directory comes from the image. Files changed there do not become part of the published image. [OCP 4.18 build hooks](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/builds_using_buildconfig/triggering-builds-build-hooks).

## Why It Matters for EX288

This exercise applies build-configuration and troubleshooting skills without changing application source. It also tests whether your verification distinguishes configuration from execution evidence. See the [EX288 study objectives](https://www.redhat.com/en/services/training/ex288-red-hat-certified-openshift-application-developer-exam).

## Important Resources

- `BuildConfig` and `Build`: `build.openshift.io/v1`.
- `ImageStream`: `image.openshift.io/v1`.
- `Deployment`: `apps/v1`; `Service` and `Pod`: `v1`.
- `Route`: `route.openshift.io/v1`.

## Key Relationships

```text
Git source + Python S2I builder
             ↓
      application image assembled
             ↓
      mailer.py hook executes
             ↓
      image published → Build Complete
             ↓
      blog:latest → Deployment → Pods
                                  ↑
                       Route → Service
```

The lab script deliberately reports execution, not a final build outcome or email delivery. Read the Build status separately. A later failure can invalidate an earlier optimistic message.

## Commands to Remember

```bash
oc set build-hook bc/blog --post-commit --script='python3 mailer.py'
oc get bc/blog -o jsonpath='{.spec.postCommit}{"\n"}'
Q5_BUILD=$(oc start-build blog -o name)
oc logs -f "$Q5_BUILD"
oc get "$Q5_BUILD"
```

## Exam Tips

- Update the recipe, then inspect a newly created attempt. Editing the BuildConfig does not rewrite older Builds.
- A marker in build logs, a completed Build, and a working application each answer a different verification question.
- The source constraint applies during the timed task. Fixture preparation is a separate phase.
- Calling a script with Python avoids a dependency on its executable bit. Its location and interpreter still need to be correct.

# Source-to-image and application delivery

## What It Is

S2I combines source with a builder image's assembly and startup behavior. This lab chooses a Python builder explicitly and uses `APP_FILE=app.py` for startup. [Python S2I documentation](https://github.com/sclorg/s2i-python-container/blob/master/3.12/README.md).

## Why It Matters for EX288

Build inputs and runtime behavior must agree. A valid build command is insufficient if the resulting application cannot start or cannot be reached.

## Important Resources

The Git repository supplies files; the BuildConfig selects its ref and builder; `blog:latest` identifies the published result. The Deployment runs it, while the Service and Route provide access.

## Key Relationships

Two independent settings are easy to confuse:

| Setting | Purpose in this lab |
| --- | --- |
| BuildConfig triggers | Empty: start builds manually with `oc start-build`. |
| BuildConfig postCommit | Runs the existing script during each eligible new build. |
| Deployment image trigger | Updates the workload image when `blog:latest` changes. |
| Service selector | Sends requests to Pods labeled `app=blog`. |
| Route | Exposes the Service through the CRC application hostname. |

The Deployment trigger is an OpenShift annotation managed by `oc set triggers`. A hook does not itself initiate a new build or an application rollout. [Deployment image trigger documentation](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/images/triggering-updates-on-imagestream-changes).

## Commands to Remember

```bash
oc get bc/blog -o yaml
oc get istag/blog:latest
oc set triggers deployment/blog
oc rollout status deployment/blog
oc get svc/blog route/blog
```

## Exam Tips

- Specify the branch that actually exists; do not assume `master`.
- Inspect the generated Route hostname rather than copying a different cluster's domain.
- A healthy old Pod can mask a failed new build. Compare image references when proving deployment of a new result.
- No SMTP service is needed to meet this task's stated requirement.
- Use the exact resource names given in an exam. Names in this study fixture are lab choices.
