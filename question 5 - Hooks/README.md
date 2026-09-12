# Question 5 — Customize a build with a post-commit hook

## Validation of Original Answer

Status: ⚠️ Partially Correct

Reviewed the attached `question5.md`, `solution.md`, and validation prompt against OpenShift Container Platform 4.18 documentation on 12 September 2026. This is a documentation and static review, not a successful live CRC test. The locally installed `oc` is 4.10.67; the cluster version could not be read because the connection was blocked in this session. Use the 4.18 client for this lab.

### Findings

- The proposed `oc set build-hook` script and command forms are valid. The question is a useful practice task, but its timing language needs correction: the hook executes in the newly built image before registry push and final build completion. A nonzero hook exit fails the build. [OpenShift 4.18 build hooks](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/builds_using_buildconfig/triggering-builds-build-hooks).
- Starting a build or searching YAML for `image:` does not establish the Python executable path. Inspect the already deployed image instead; do not guess an absolute interpreter path.
- `python3 mailer.py` requires a readable script, not its executable bit. The suggested `chmod` and commit during troubleshooting would violate the exercise's no-source-change requirement.
- The supplied mailer prints that email was sent even when its subprocess fails. Its success message proves only that execution reached that line. Email delivery is explicitly outside the question's acceptance criteria.
- Ignore a mail warning only if the script actually executes, returns successfully, and the Build reaches `Complete`. Do not ignore general network failures during cloning, dependency installation, or image publication.
- The listed build metadata variables are not a portable promise of their availability inside the hook image. In particular, do not rely on the supplied `OPENSHIFT_BUILD_SOURCE` spelling or claim a final successful build from within the hook. Inspect the Build resource for its identity and revision.
- The original setup relies on builder auto-detection and an assumed `master` branch. The revised fixture explicitly selects Python 3.12, branch `main`, and a Deployment. Existing Flask pins are not needed for this simple exercise; a small standard-library web application avoids extra application dependencies.
- Exact build names, log headings, and return codes in the source answer are illustrative, not expected platform output. Build-specific logs and status provide stronger evidence.
- No PVC, database, custom RBAC, Helm, or Kustomize is required. Service selection, port mapping, image triggers, and route readiness are established in the setup document.

### Environment-specific changes required

| Item | Adapted value |
| --- | --- |
| Project | `ex288-q5` |
| Application / BuildConfig / ImageStream / Deployment / Service / Route | `blog` |
| Repository | `https://gitlab.com/hits.govind/ex288-q5-blog.git` |
| Git ref | `main` |
| Python S2I builder | `registry.access.redhat.com/ubi9/python-312:latest` |
| Route domain | `apps-crc.testing` |
| Expected generated hostname | `blog-ex288-q5.apps-crc.testing`; always inspect the actual Route |

The repository is a proposed lab prerequisite, not a repository whose existence has been verified. The rebuilt mailer is a deliberate simulation: it logs execution and sends no mail. Preparing these files is allowed before the timed exercise; editing them during the exercise is not.

## EX288 Objective

**HIGH — strongly aligned with published EX288 objectives.** Practices build configurations, source-based image builds, and troubleshooting, with Git and application access as supporting skills. This classification maps the exercise to published areas; it does not assert that this exact hook question appears on an exam. [Published EX288 objectives](https://www.redhat.com/en/services/training/ex288-red-hat-certified-openshift-application-developer-exam).

## Difficulty

**Moderate.** The edit is short; interpreting build status and preserving the source are the main challenges.

## Realistic Exam Time

Estimated completion time: **8–12 minutes** with the environment already prepared, including reading, inspection, one build, and verification. Allow **12–18 minutes** if performing a second rebuild or encountering cold image pulls. These are planning estimates, not measured CRC timings.

Initial setup takes approximately **20–35 minutes** separately. If the exercise exceeds about 15 minutes, inspect configuration and logs, then move on and return later under exam conditions.

## Scenario

The Python application `blog` is already running in project `ex288-q5`, prepared using [environment.md](environment.md). Its source is `https://gitlab.com/hits.govind/ex288-q5-blog.git`, branch `main`. The image contains `mailer.py` in the application working directory.

The existing source build outputs to `blog:latest`; a Deployment, Service on port 8080, and HTTP Route under `*.apps-crc.testing` provide access. No persistent storage, application Secrets, ConfigMaps, or mail server is required. The public practice repository needs no Git source Secret.

Customize the build so that the existing script executes automatically as part of subsequent builds, after image assembly. Preserve application availability and leave the source repository unchanged.

## Requirements

1. Keep the `blog` application accessible through its existing Route.
2. Automatically execute the existing `mailer.py` during builds that reach the post-image-assembly stage.
3. Ensure the most recent build is `Complete`, with logs demonstrating script execution.
4. Persist the configuration for future builds created from `bc/blog`.
5. Do not edit or push the source repository during the exercise. Sending mail is not required.

## Solution

Run the following in the same terminal. Stop and diagnose any failed command.

```bash
oc project ex288-q5
oc get bc/blog -o yaml
oc exec deployment/blog -- python3 -c 'import os,sys; print(sys.executable); print(os.getcwd()); assert os.path.isfile("mailer.py")'

Q5_SOURCE_BEFORE=$(git ls-remote https://gitlab.com/hits.govind/ex288-q5-blog.git refs/heads/main)
test -n "$Q5_SOURCE_BEFORE"

oc set build-hook bc/blog --post-commit --script='python3 mailer.py'
oc get bc/blog -o jsonpath='{.spec.postCommit}{"\n"}'

Q5_BUILD=$(oc start-build blog -o name)
test -n "$Q5_BUILD"
oc logs -f "$Q5_BUILD"
oc wait --for=jsonpath='{.status.phase}'=Complete "$Q5_BUILD" --timeout=10m
```

The deployed image is useful for checking interpreter and source location because setup builds it from the same repository and builder. If those inputs have changed, check the new build's logs and image instead. Do not run `mailer.py` manually as proof of hook execution.

Alternative to the script-setting command, after verifying `python3` is available:

```bash
oc set build-hook bc/blog --post-commit --command -- python3 mailer.py
```

Choose one form. Do not configure both `script` and `command` in YAML. [Hook configuration reference](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/builds_using_buildconfig/triggering-builds-build-hooks).

## Verification

```bash
oc get "$Q5_BUILD" -o jsonpath='{.metadata.name}{" phase="}{.status.phase}{"\n"}{.spec.postCommit}{"\n"}'
oc logs "$Q5_BUILD"
oc get builds --sort-by=.metadata.creationTimestamp
oc get bc/blog -o jsonpath='{.spec.postCommit}{"\n"}'

oc rollout status deployment/blog --timeout=3m
oc get pods -l app=blog
oc get svc/blog route/blog
Q5_HOST=$(oc get route/blog -o jsonpath='{.spec.host}')
curl --fail --show-error "http://$Q5_HOST/"

Q5_SOURCE_AFTER=$(git ls-remote https://gitlab.com/hits.govind/ex288-q5-blog.git refs/heads/main)
test -n "$Q5_SOURCE_AFTER" && test "$Q5_SOURCE_BEFORE" = "$Q5_SOURCE_AFTER"
```

Expected: the selected Build is `Complete`; its logs contain `Q5_MAILER_EXECUTED` and `mailer.py script executed successfully`; the Build and BuildConfig both contain the hook; Pods are ready; HTTP returns the Blog Application page. Confirm the selected Build is also the newest `blog` build. A build that was already running when you changed the BuildConfig may have an older configuration.

The Git comparison establishes that the branch tip is unchanged across the exercise, assuming no concurrent writers. It is not a full repository audit. In a local clone, `git status --short` should also be empty.

For extra practice, prove persistence using a second build and repeat the same checks:

```bash
Q5_BUILD=$(oc start-build blog -o name)
oc logs -f "$Q5_BUILD"
oc wait --for=jsonpath='{.status.phase}'=Complete "$Q5_BUILD" --timeout=10m
oc get "$Q5_BUILD" -o jsonpath='{.spec.postCommit}{"\n"}'
```

Application availability alone does not prove that a new image was deployed. The previous healthy Pods can still serve traffic. If checking the new rollout, compare the Deployment image with the digest referenced by `istag/blog:latest` and check the image trigger.

## GUI Alternative

**Recommended method: CLI.** The console YAML editor is useful for inspecting the result but slower for this single change.

In the Administrator perspective, select `ex288-q5`, open **Builds → BuildConfigs → blog → YAML**. If this navigation is hidden, use the console resource search to find BuildConfig `blog` in the project. Under the existing `spec`, add:

```yaml
postCommit:
  script: python3 mailer.py
```

Save without replacing other fields. Use **Start Build** from the BuildConfig actions, then open that Build's logs and confirm its status is `Complete`. Inspect the Route and open its location. Labels can vary with console configuration; the resource and field names are authoritative.

## Troubleshooting

| Symptom | Check and response |
| --- | --- |
| No marker | Inspect the specific Build's `spec.postCommit`; make a fresh build from `blog` after saving the hook. |
| Interpreter not found | Inspect `sys.executable` in the prepared image. Use the verified executable, not a guessed path. |
| Script not found | Inspect image working directory and BuildConfig source URI, ref, and context directory. Fix the hook's path if needed; do not edit source to solve the task. |
| Failed hook | Read the build logs for Python exceptions or nonzero exit. Do not append `|| true`, which could hide a script that never ran. |
| Build wait times out | A failed Build will not reach `Complete`; inspect status, reason, and logs immediately. |
| Source/image pull error | Check Git access, registry access, cluster egress, and pull credentials. These are prerequisite failures. |
| Hook succeeds, build fails | Inspect later image publication errors. Hook execution alone does not establish build success. |
| HTTP fails | Verify Route admission, host DNS, Service endpoints, Pod readiness, and application port. |
| New image not consumed | Check the Deployment's image trigger and image value; a rollout command can return for the old revision before an asynchronous trigger is processed. |

```bash
oc describe "$Q5_BUILD"
oc logs "$Q5_BUILD"
oc describe bc/blog
oc get events --sort-by=.lastTimestamp
oc logs deployment/blog
oc get svc/blog -o yaml
oc get endpointslices -l kubernetes.io/service-name=blog
oc describe route/blog
oc set triggers deployment/blog
oc get deployment/blog -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
oc get istag/blog:latest -o jsonpath='{.image.dockerImageReference}{"\n"}'
```

## Key Exam Takeaway

Set the hook on the BuildConfig, then verify a new Build's configuration, logs, and final status. Keep source changes out of the solution.

## References and Validation Scope

- [OpenShift 4.18 build hooks](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/builds_using_buildconfig/triggering-builds-build-hooks): timing and supported hook forms.
- [OpenShift 4.18 CLI reference](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/cli_tools/openshift-cli-oc): CLI operations and client installation.
- [Python S2I image documentation](https://github.com/sclorg/s2i-python-container/blob/master/3.12/README.md): selected builder and application startup settings. This upstream page evolves independently of OCP.
- [OpenShift 4.18 image triggers](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/images/triggering-updates-on-imagestream-changes): Deployment updates from ImageStreams.

Runnable instructions and local syntax checks do not establish actual GitLab reachability, builder pulls, cluster readiness, or end-to-end success. Those checks are supplied in the lab procedure.

# Overall Assessment

## Questions Reviewed

Total: 1.

## Validation Results

- Correct: 0
- Partially correct: 1
- Incorrect: 0

## EX288 Relevance

- High: 1
- Medium: 0
- Low: 0

## Estimated Total Practice Time

Approximately **0.5–0.8 hours**, including setup and one timed attempt; allow extra time for slow pulls or a second rebuild.

## Strongest Topics Covered

- BuildConfig customization and build evidence.
- Source preservation and image/runtime inspection.
- Basic image-to-application wiring.

## Missing EX288 Topics

This question does not sufficiently cover multi-container applications, Helm, Kustomize, probes, registry configuration, or broader application deployment troubleshooting. Compare your exam booking's objectives with the [published EX288 study points](https://www.redhat.com/en/services/training/ex288-red-hat-certified-openshift-application-developer-exam).

## Recommended Practice Order

Prepare [environment.md](environment.md), attempt the Scenario without reading the Solution, verify your result, then review [command-reference.md](command-reference.md) and [theory-summary.md](theory-summary.md).

## Final Exam Readiness Notes

Practise selecting the exact Build, reading its failure reason, and distinguishing a successful hook from a successful build and a healthy application. Repeat until the configuration and verification fit the estimated time.
