# EX288 Command Reference

Question 5 only. Commands assume the prepared `ex288-q5` environment and a 4.18 client. Alternatives and reset commands are not intended to be run sequentially.

## Project and Inputs

```bash
oc project ex288-q5
oc get bc/blog -o yaml
oc get bc/blog -o jsonpath='{.spec.source.git}{"\n"}{.spec.strategy}{"\n"}{.spec.output}{"\n"}'
git ls-remote https://gitlab.com/hits.govind/ex288-q5-blog.git refs/heads/main
git status --short  # Run inside the source clone.
```

## Build Hooks

```bash
# Recommended form for this fixture:
oc set build-hook bc/blog --post-commit --script='python3 mailer.py'

# Alternative direct executable form:
oc set build-hook bc/blog --post-commit --command -- python3 mailer.py

oc get bc/blog -o jsonpath='{.spec.postCommit}{"\n"}'
oc set build-hook --help

# Reset only after finishing the exercise:
oc set build-hook bc/blog --post-commit --remove
```

Use one form; the hook belongs on the BuildConfig. [OCP 4.18 hook syntax](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/builds_using_buildconfig/triggering-builds-build-hooks).

## Start and Inspect a Specific Build

```bash
Q5_BUILD=$(oc start-build blog -o name)
oc logs -f "$Q5_BUILD"
oc wait --for=jsonpath='{.status.phase}'=Complete "$Q5_BUILD" --timeout=10m
oc get "$Q5_BUILD" -o jsonpath='{.status.phase}{"\n"}{.status.reason}{"\n"}{.spec.postCommit}{"\n"}'
oc describe "$Q5_BUILD"
oc get builds --sort-by=.metadata.creationTimestamp
```

`Q5_BUILD` contains the resource name returned by OpenShift. Keep it in the same terminal. A wait for `Complete` times out if the build fails; read logs and status rather than treating timeout as the cause.

## Images and Deployment

```bash
oc get is/blog
oc get istag/blog:latest -o jsonpath='{.image.dockerImageReference}{"\n"}'
oc get deployment/blog -o jsonpath='{.spec.template.spec.containers[*].image}{"\n"}'
oc set triggers deployment/blog
oc rollout status deployment/blog --timeout=3m
oc get pods -l app=blog
oc logs deployment/blog
oc exec deployment/blog -- python3 -c 'import os,sys; print(sys.executable); print(os.getcwd()); print(os.path.isfile("mailer.py"))'
```

Setup or trigger repair, if needed:

```bash
Q5_CONTAINER=$(oc get deployment/blog -o jsonpath='{.spec.template.spec.containers[0].name}')
oc set triggers deployment/blog --from-image=blog:latest -c "$Q5_CONTAINER"
```

The image trigger connects published images to the Deployment. [OCP 4.18 image triggers](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/images/triggering-updates-on-imagestream-changes).

## Service, Route, and Diagnostics

```bash
oc get svc/blog route/blog
oc get endpointslices -l kubernetes.io/service-name=blog
oc describe route/blog
Q5_HOST=$(oc get route/blog -o jsonpath='{.spec.host}')
curl --fail --show-error "http://$Q5_HOST/"
oc get events --sort-by=.lastTimestamp
oc describe bc/blog
```

See [environment.md](environment.md) for repository creation and the initial build. No unrelated Helm, storage, or database commands are needed for this question.
