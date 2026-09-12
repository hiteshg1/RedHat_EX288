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
oc start-build blog                     # Start and capture one build.
oc logs -f bc/blog                      # Follow that build's output.
oc describe bc/blog                     # Inspect failure details.
oc get builds
```

## Application and route

```bash
oc rollout status deployment/blog
oc logs deployment/blog
oc get route/blog
curl "http://$(oc get route/blog -o jsonpath='{.spec.host}')"
```

## Source revision

```bash
# Compare the returned SHA before and after the exercise.
git ls-remote https://gitlab.com/hits.govind/blog.git refs/heads/main
```
