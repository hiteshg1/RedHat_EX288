# Answer 5

## Solution

```bash
oc project octane

# Record the main branch SHA before making changes.
git ls-remote https://gitlab.com/hits.govind/blog.git refs/heads/main

oc set build-hook bc/blog --post-commit --script='python3 mailer.py'

BUILD=$(oc start-build blog -o name)
oc logs -f "$BUILD"
```

Keep the same terminal for verification. `BUILD` captures the actual build name. All changes are to OpenShift configuration; no source edit or Git push is needed.

## Verification

```bash
oc wait --for=jsonpath='{.status.phase}'=Complete "$BUILD" --timeout=10m
oc get builds --sort-by=.metadata.creationTimestamp
oc get bc/blog -o jsonpath='{.spec.postCommit}{"\n"}'

oc rollout status deployment/blog --timeout=3m
oc get route/blog
curl --fail --show-error "http://$(oc get route/blog -o jsonpath='{.spec.host}')"

git ls-remote https://gitlab.com/hits.govind/blog.git refs/heads/main
```

Confirm:

- The followed build log contains `mailer.py script executed successfully`.
- The newest `blog` build is `Complete`. A mail warning is acceptable only when the script ran and the build completed.
- The BuildConfig still contains `python3 mailer.py`, which applies to future builds.
- The Deployment is available and HTTP returns the **Blog Application** page.
- The Git SHA matches the value recorded before the solution. This checks the branch tip, assuming no concurrent source changes.

## Troubleshooting

| Problem | Check / fix |
| --- | --- |
| Python or script not found | Run `oc exec deployment/blog -- sh -c 'command -v python3; pwd; ls -l mailer.py'`. Correct the hook to use the verified interpreter or script path; do not change Git. |
| Build fails or script output is missing | Run `oc logs "$BUILD"` and `oc describe "$BUILD"`. Check its hook configuration and failure reason. Do not hide errors with `|| true`. |
| Route does not respond | Run `oc describe route/blog`, `oc get endpointslices -l kubernetes.io/service-name=blog`, and `oc logs deployment/blog`. Check CRC DNS, ready endpoints, and port 8080. |

## Key takeaway

Configure the hook on the BuildConfig, then prove that a new build ran it and completed successfully. Script output alone does not prove email delivery or build success.
