# Question 5 — Command reference

## Project and build configuration

```bash
oc project octane                         # Select the project.
oc describe bc/blog                      # Inspect build configuration.
oc set build-hook bc/blog --post-commit --script='python3 mailer.py'
oc get bc/blog -o jsonpath='{.spec.postCommit}{"\n"}'
```

## Build execution and evidence

```bash
BUILD=$(oc start-build blog -o name)       # Start and capture one build.
oc logs -f "$BUILD"                       # Follow that build's output.
oc wait --for=jsonpath='{.status.phase}'=Complete "$BUILD" --timeout=10m
oc describe "$BUILD"                      # Inspect failure details.
oc get builds --sort-by=.metadata.creationTimestamp
```

## Application and route

```bash
oc rollout status deployment/blog --timeout=3m
oc logs deployment/blog
oc get route/blog
curl --fail --show-error "http://$(oc get route/blog -o jsonpath='{.spec.host}')"
```

## Source revision

```bash
# Compare the returned SHA before and after the exercise.
git ls-remote https://gitlab.com/hits.govind/blog.git refs/heads/main
```
