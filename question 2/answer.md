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
# Alternative Way to rebuild from local GIT clone
### Delete the old deployment,service,route,imagestream and buildconfig
Deletes the running Deployment, internal Service, external Route, BuildConfig, and ImageStream. 

Removes the old configuration that still described port 80 and the original Git-based build setup
```bash
oc delete deployment/q2-web service/q2-web route/q2-web buildconfig/q2-web imagestream/q2-web
```

### Creates a fresh Docker BuildConfig that accepts files uploaded from your machine
Tells OpenShift to build an image from local source rather than cloning the Git repository
```bash
oc new-build --binary --strategy=docker --name=q2-web
```

### Uploads the current directory, including its amended Dockerfile, and runs the build
Produces a new q2-web:latest image from exactly the files in your local clone
```bash
oc start-build q2-web --from-dir=. --follow
```

### Creates a new Deployment and Service from that freshly built image
OpenShift reads the image metadata, including its exposed port, to generate the workload and Service correctly
```bash
oc new-app --image-stream=q2-web:latest --name=q2-web
```

### Creates a public Route for the Service
Makes the application reachable at an OpenShift hostname
```bash
oc expose service/q2-web
```

There are three seperate layers:
```
Dockerfile
   ↓ builds
ImageStream: q2-web:latest
   ↓ deployed by
Deployment
   ↓ reached inside the cluster through
Service
   ↓ published outside the cluster through
Route
```

- Your original Git-based deployment created the bottom three layers when the image declared or was configured for port 80. 
- Rebuilding the image later updated only the image layer; it did not rewrite the already-existing Deployment and Service. That is why the port stayed at 80.
- Deleting and recreating the resources caused oc new-app to generate a new Deployment and Service from the metadata in the rebuilt image. 
- If your amended Dockerfile exposes and runs the application on 8080, the new objects can now use that port consistently.
- One final point: EXPOSE 8080 documents the port for OpenShift and tooling, but the application’s startup command must also actually listen on 8080.

## Validation
```bash
ansible@fedora-prd-rnd:~$ oc get route
NAME     HOST/PORT                                 PATH   SERVICES   PORT       TERMINATION   WILDCARD
q2-web   q2-web-container-build.apps-crc.testing          q2-web     8080-tcp                 None

ansible@fedora-prd-rnd:~$ curl -I http://q2-web-container-build.apps-crc.testing
HTTP/1.0 200 OK
server: SimpleHTTP/0.6 Python/3.9.25
date: Sat, 22 Aug 2026 18:00:58 GMT
content-type: text/html
content-length: 17
last-modified: Sat, 22 Aug 2026 17:44:38 GMT
set-cookie: 49e1b0c007dfd95cf506d2052b8f2c9c=456e14017e2c21d07b26ad7bde500d38; path=/; HttpOnly
cache-control: private
connection: keep-alive
```