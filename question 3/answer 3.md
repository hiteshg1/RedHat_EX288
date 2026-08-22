# Answer: S2I Build in One Project, Deployment in Another

## Core idea

The exercise separates **building** from **running**:

```text
Git repository
  -> S2I build in s2i-builds
  -> ImageStreamTag s2i-builds/oxy:latest
  -> permission to pull that image
  -> Deployment, Service, and Route in tocin
```

The `.s2i/bin/assemble` file is not a script that runs when the application pod starts. OpenShift copies it into the temporary build environment and runs it while producing the image. Its output files become part of the finished image.

## Replace .s2i/bin/assemble with

`index.html` must contain the required main-page text. The custom assemble script should be executable and must preserve the HTTPD builder's normal assembly action:

```bash
#!/bin/bash
set -e

echo "Running custom assemble script..."

cd /opt/app-root/src

# The source cloned from Git is staged here during the S2I build.
# In the correct HTTPD S2I builder, ./ is the application/document directory.
cp -Rf /tmp/src/*.html ./

DATE=$(date '+%F')
{
  echo "$DATE"
  echo "Your info.html is working if you see this."
} > ./info.html

# Continue with the normal HTTPD S2I assembly process.
exec /usr/libexec/s2i/assemble
```

Commit and push the change to the repository's `main` branch.
```bash
chmod +x .s2i/bin/assemble
git add .
git commit -m "Customize S2I assembly for oxy"
git push
```

## Build the image

Use an explicit OpenShift-provided HTTPD S2I builder, not an unqualified `httpd:2.4` reference. The latter can resolve to a generic Apache image without S2I support.

### Query the imagestream in the openshift namespace to see what httpd images are available
```bash
$ oc get imagestream -n openshift | grep -i httpd
httpd   default-route-openshift-image-registry.apps-crc.testing/openshift/httpd     2.4-el8,2.4-ubi8,2.4-ubi9,latest    17 months ago
```

```bash
oc new-project s2i-builds
oc project s2i-builds

oc new-app openshift/httpd:2.4-ubi8~https://gitlab.com/hits.govind/oxy.git#main \
  --name=oxy \
  --strategy=source

oc logs -f bc/oxy

oc get istag oxy:latest

#Example of actual output
ansible@fedora-prd-rnd:~/gitlab/oxy$ oc get istag
NAME         IMAGE REFERENCE                                                                                                                           UPDATED
oxy:latest   image-registry.openshift-image-registry.svc:5000/s2i-builds/oxy@sha256:ef9a3c567badfd6ad9b147b349fca7e86e917d1739c081a82fc6698f74db3c30   35 minutes ago
```

The log should include `Running custom assemble script...`. A successful build creates the `oxy:latest` ImageStream tag in `s2i-builds`.

## Allow the cross-project pull and deploy

```bash
#Create new project tocin
oc new-project tocin

# The `tocin` namespace needs permission to pull the image from `s2i-builds`:
oc policy add-role-to-user system:image-puller \
  system:serviceaccount:tocin:default \
  --namespace=s2i-builds

#Change into the project
oc project tocin

# Build the new app using the imagestream, oxy:latest
oc new-app s2i-builds/oxy:latest --name=oxy

# Check the rollout status
oc rollout status deployment/oxy

# Check logs (look out for Running custom assemble script...around line 26). This confirms your custom assemble script is executing.
oc logs -f bc/oxy

#Example,
STEP 4/10: USER root
STEP 5/10: COPY upload/scripts /tmp/scripts
STEP 6/10: COPY upload/src /tmp/src
STEP 7/10: RUN chown -R 1001:0 /tmp/scripts /tmp/src
STEP 8/10: USER 1001
STEP 9/10: RUN /tmp/scripts/assemble
Running custom assemble script...
---> Enabling s2i support in httpd24 image

# Validate pods are running
ansible@fedora-prd-rnd:~/gitlab/oxy$ oc get pods
NAME                   READY   STATUS      RESTARTS   AGE
oxy-1-build            0/1     Completed   0          48m
oxy-86c8fd645c-v55zh   1/1     Running     0          47m

# Expose the service and get the route
oc expose service/oxy
oc get route oxy
```

## Verify

Use the hostname returned by `oc get route oxy`, rather than the exercise's `apps.ocp4.example.com` example when working on CRC.

For the lab environment, add the route to the /etc/hosts file
```bash
10.10.157.233 oxy-tocin.apps-crc.testing
```

```bash
curl http://oxy-tocin.apps-crc.testing
curl http://oxy-tocin.apps-crc.testing/info.html

# Example
$ curl http://oxy-tocin.apps-crc.testing
<!DOCTYPE html>
<html>
<head>
  <title>Oxy Application</title>
</head>
<body>
  <h1>Amor vincit omnia</h1>
</body>
</html>

$ curl http://oxy-tocin.apps-crc.testing/info.html
2026-08-22
Your info.html is working if you see this.

# Verify Cross-Namespace Image Reference
oc get deployment oxy -n tocin \
  -o jsonpath='{.spec.template.spec.containers[0].image}'

# Expected output
image-registry.openshift-image-registry.svc:5000/s2i-builds/oxy@sha256:ef9a3c567badfd6ad9b147b349fca7e86e917d1739c081a82fc6698f74db3c30
```

The deployment image should reference `s2i-builds/oxy`, and `info.html` should show the date on which the image was built.

## Why the assemble script matters

It proves that you can customize an existing S2I builder without creating your own Dockerfile. The builder performs its normal HTTPD setup, while your script adds project-specific build work:

- copy the HTML source into the image's web-content directory;
- generate an additional page at build time; and
- hand control back to the original HTTPD S2I assemble script.

As a result, every rebuilt image contains a newly generated build date in `info.html`.

## Common Issues and Troubleshooting

| Issue | Symptom | Fix |
|-------|---------|-----|
| **Image pull error** | `ErrImagePull` in tocin namespace | Grant `system:image-puller` role to tocin's default SA |
| **Assemble script not executing** | Custom code doesn't run | Ensure script is executable: `chmod +x .s2i/bin/assemble` |
| **Files not copied** | HTML files missing in pod | Verify `cp -Rf /tmp/src/*.html ./` in assemble script |
| **Date format wrong** | Date not in YYYY-mm-dd | Use `date "+%F"` or `date "+%Y-%m-%d"` |
| **info.html not generated** | 404 on /info.html | Check assemble logs: `oc logs bc/oxy -n s2i-builds` |
| **Wrong namespace** | Build or deploy fails | Verify current namespace: `oc project` |

**If cross-namespace pull fails:**

```bash
# Check role binding
oc get rolebinding -n s2i-builds | grep image-puller

# Re-apply permission
oc policy add-role-to-user system:image-puller \
  system:serviceaccount:tocin:default \
  --namespace=s2i-builds

# Check deployment events
oc describe deployment oxy -n tocin

# Force new rollout
oc rollout restart deployment/oxy -n tocin
```

---

## Cleanup 

```bash
oc delete project s2i-builds
oc delete project tocin
cd ~
rm -rf oxy
```
