# Answer 5

## Solution

```bash
oc project octane

# Record the main branch SHA before making changes.
git ls-remote https://gitlab.com/hits.govind/blog.git refs/heads/main

# Add a post-commit hook for the buildconfig for the mailer.py script
oc set build-hook bc/blog --post-commit --script='python3 mailer.py'

# Start the build
oc start-build bc/blog

# Monitor the build and look out for the following message "mailer.py script executed successfully"
oc logs -f bc/blog
```

Keep the same terminal for verification. `BUILD` captures the actual build name. All changes are to OpenShift configuration; no source edit or Git push is needed.

## Verification

```bash
# Verify there is a post-commit script on the buildconfig
oc get bc/blog -o yaml | grep -inA2 postcommit

# Expected Output
23:  postCommit:
24-    script: python3 mailer.py
25-  resources: {}

oc rollout status deployment/blog
# Expected output
deployment "blog" successfully rolled out

# Check if the service is still reachable
oc expose svc/blog

oc get route

curl http://blog-octane.apps-crc.testing
```

## Confirm:

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

## Key Commands Reference
```bash
# Set post-commit build hook (command style)
oc set build-hook bc/<name> --post-commit --command -- <command> <args>

# Set post-commit build hook (script style)
oc set build-hook bc/<name> --post-commit --script="<script>"

# Verify build hook
oc describe bc/<name> | grep -A 5 "Post Commit"

# View BuildConfig YAML
oc get bc/<name> -o yaml

# Trigger build
oc start-build <name>

# Watch build logs
oc logs -f bc/<name>

# Check build status
oc get builds

# Remove build hook
oc set build-hook bc/<name> --post-commit --remove

```