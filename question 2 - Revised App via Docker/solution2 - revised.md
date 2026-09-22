## Solution (Timed Exercise - 15 minutes)

### Step 1: Create Project

```bash
oc new-project container-build
```

### Step 2: Clone and Inspect

```bash
cd ~
git clone https://gitlab.com/hits.govind/container-build
cd container-build
vim Dockerfile
```

### Step 3 - Apply these optimizations

1. **Combine multiple RUN statements into one** (reduces layers)
2. **Combine multiple LABEL statements** (reduces layers)
3. **Add ONBUILD instruction** to allow child image overrides

**Optimized Dockerfile:**

```dockerfile
FROM registry.access.redhat.com/ubi8/ubi-minimal:latest

LABEL version="1.0" \
      description="this is Dockerfile" \
      maintainer="Red Hat Training <training@redhat.com>"

USER root

RUN microdnf install -y python3 && \
    microdnf clean all && \
    mkdir -p /app && \
    echo "Hello container!" > /app/index.html

ENV DOCROOT=/app

ONBUILD COPY src/ /app

EXPOSE 8080

USER 1001

WORKDIR /app

CMD ["python3", "-m", "http.server", "8080"]
```

---

### Step 4: Build the image locally and ensure in means the requirements
```bash
podman build -t webapp-parent .

podman images

podman run --rm --name webapp-parent webapp-parent:latest
```


### Step 5: Commit and Push Optimized Dockerfile
```bash
git add .
git commit -m "Optimize Dockerfile - combine RUN/LABEL, add ONBUILD"
git push
```

### Step 6: Build the Parent application
Build the parent application
```bash
oc new-app --name webapp-parent --strategy=docker https://gitlab.com/hits.govind/container-build
```

Verify the application is fine
```bash
oc get po -w
```

Expose the service and check the application
```bash
oc expose svc/webapp-parent-container-builds.apps.crc.testing

oc get route

curl http://webapp-parent
```


---
## Part 2
### Step 6: Build Image Using Binary Build (modify the Dockerfile to use the parent image)

Get the image path for the parent image
```bash
oc get images | grep webapp-parent
```
Modify the Dockerfile for the child-app
```bash
FROM image-registry.openshift-image-registry.svc:5000/container-build/webapp-parent
```

Build the child app
```bash
oc new-build --name=webapp-child --strategy=docker --binary=true

oc start-build webapp-child --from-dir=. --follow
```

Create the child app
```bash
oc new-app webapp-child:latest --name=webapp-child
```

Verify the build completed successfully.
```bash
oc get po -w
```

Expose the service and curl the route
```bash
oc expose svc/webapp-child

curl http://webapp-child-container-builds.apps.crc.testing
---

### Step 8: Deploy the Built Image

```bash
oc new-app container-build --name=webapp
```

**Wait for deployment:**

```bash
oc get pods
```

---

### Step 9: Expose Service

```bash
oc expose svc/webapp
```

---

### Step 10: Verify Application

```bash
oc get route
curl http://webapp-container-build.apps.ocp4.example.com
```

**Expected output:**

```html
Hello container!
```



## Success Criteria

- Project `container-build` exists
- Application `app-optimize` is running
- Route `app-optimize.apps.ocp4.example.com` is accessible and returns "Hello container!"
- Dockerfile has 7 or fewer layers
- Image size is under 256 MiB
- `ONBUILD COPY src/ ${DOCROOT}` instruction exists in Dockerfile
- Child images can override content by providing `src/` directory

---

## Key Commands Reference

```bash
# Count layers in Dockerfile
grep -E '^(FROM|RUN|COPY|ADD|LABEL)' Dockerfile | wc -l

# Create binary build
oc new-build --name=<name> --strategy=docker --binary=true

# Start build from directory
oc start-build <build-name> --from-dir=. --follow

# Create app from imagestream
oc new-app <imagestream>:<tag> --name=<app>

# Expose service
oc expose svc/<app> --hostname=<hostname>

# Check image size
oc get is <imagestream> -o jsonpath='{.status.tags[0].items[0].dockerImageMetadata.Size}'

# Describe imagestream
oc describe is/<imagestream>
```

---


### Helpful commands 

```bash
# Check build logs
oc logs -f bc/container-build

# Verify Dockerfile syntax
podman build -t test .

# Check build config
oc describe bc/container-build
```

---

## Cleanup (After Exercise)

```bash
oc delete project crimson
cd ~
rm -rf build child-test
```
