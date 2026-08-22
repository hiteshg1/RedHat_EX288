## Answer

### 1. Create and select the project

```bash
oc new-project container-build
oc project container-build
```

### 2. Create the Docker build and application

```bash
oc new-app --code=https://gitlab.com/hits.govind/container-build.git#main \
  --strategy=docker --name=q2-web
```

Monitor the build and application pods:

```bash
oc get pods -w
```

If the application pod fails, inspect its current and previous logs:

```bash
oc logs pod/<application-pod-name>
oc logs pod/<application-pod-name> --previous
```

### 3. Expose and test the application

Create a Route after the Service exists:

```bash
oc expose svc/q2-web
oc get route q2-web
```

Test using the host shown by `oc get route`:

```bash
curl -I http://q2-web-container-build.apps-crc.testing
```

A successful deployment returns an HTTP `200` response.

---

## Recovery: application crashes because it listens on port 80

OpenShift normally runs containers with an arbitrary non-root user. An application that attempts to bind directly to port 80 can fail with a permission-denied error. Run the application on port 8080 instead.

Clone the repository and inspect the Dockerfile:

```bash
git -c http.proxy=http://10.10.152.62:3128 clone \
  https://gitlab.com/hits.govind/container-build.git
cd container-build
cat Dockerfile
```

Update the Dockerfile so that the application listens on port 8080. For a Python HTTP server, the relevant lines are:

```dockerfile
EXPOSE 8080
CMD ["python3", "-m", "http.server", "8080"]
```

Also optimise the Dockerfile as required so that the final image is below 256 MB. Commit and push the corrected Dockerfile:

```bash
git add Dockerfile
git commit -m "Run application on port 8080"
git push origin main
```

### Clean redeployment

Remove the old generated objects, including the BuildConfig and ImageStream. This matters because deleting only the Deployment leaves the old build configuration and image available for reuse.

```bash
oc delete deployment,service,route,buildconfig,imagestream -l app=q2-web --ignore-not-found
```

Recreate the application from the corrected repository, wait for it to become available, then expose it:

```bash
oc new-app --code=https://gitlab.com/hits.govind/container-build.git#main \
  --strategy=docker --name=q2-web

oc rollout status deployment/q2-web
oc expose svc/q2-web
curl -I http://q2-web-container-build.apps-crc.testing
```

### Expected port configuration

The corrected application should use port 8080 consistently:

```text
Route -> Service port 8080 -> pod port 8080
```

Verify the final objects:

```bash
oc describe deployment/q2-web
oc describe svc/q2-web
oc describe route/q2-web
```
