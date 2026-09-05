# OC Commands Reference
---

## Logging in OpenShift Cluster
```bash
# Shows API for logging in via CLI
oc whoami --show-server

# Shows Web URL
oc whoami --show-console

# Log in using username and password and logging in using token
oc login -u developer -p developer https://api.ocp4.example.com:6443
oc login -u developer -p $(oc whoami -t) https://api.ocp4.example.com:6443
```

## Log in via Skopeo
```bash
skopeo login --username myuser --password mypass <registry>
skopeo inspect docker://<registry:port>/user/app:tag

# Example
skopeo login registry.ocp4.example.com:8443 -u developer -p developer
skopeo inspect docker://registry.ocp4.example.com:8443/redhattraining/hello-world-nginx
```
---
## Creating, Viewing and Deleting Projects
```bash 
oc new-project <project_name>
oc get projects
oc delete project <project_name>
```

## Creating a Secret for a Docker Registry
### Syntax of command and steps

```bash
# Step 1: Create the Secret
oc create secret docker-registry <secret_name> \
    --docker-server=<registry_url> \
    --docker-username=<username> \
    --docker-password=<password> \
    --docker-email=<email_address>

# Step 2: Link the secret to the default service account
oc secrets link default <pull_secret_name> --for=pull

# Step 3: Verify the link
oc get serviceaccount default -o yaml

# Step 4: Unlink a wrong credential
oc secrets unlink default <pull_secret_name> --for=pull
```

Example
```bash
oc create secret docker-registry \
docker-registry-credentials \
--docker-server=registry.ocp4.example.com:8443 \
--docker-username=developer \
--docker-password=developer \
--docker-email=developer@example.org

oc secrets link default docker-registry-credentials --for=pull
```
---
## Viewing Events
```bash
# Stream/Watch events in real time
oc get events -w

# Filter by specific event types
oc get events --field-selector type=Warning

# Sort events by the time they occurred
oc get events --sort-by='.metadata.creationTimestamp'
```
---
## Importing an Image Stream & Deploying the app
```bash
# Step 1: Create/select the project
oc new-project <project-name>

# Step 2: Import the external image into an ImageStream
oc import-image <imagestream-name>:<tag> --from=<external-image-url> --confirm

# Step 3: Verify the ImageStream and tags
oc get is
oc get istag

# Step 4: Inspect the ImageStreamTag
oc describe istag/<imagestream-name>:<tag>

# Step 5: Deploy an application from the ImageStream
oc new-app --name=<app-name> --image-stream=<imagestream-name>:<tag> 

# Step 6: Verify the deployment
oc get pods
oc get deploy
oc get svc
oc get route
curl http://<app-name>-<project-name>.<cluster-dns>

# Example
oc import-image hello-world --from registry.ocp4.example.com:8443/redhattraining/hello-world-nginx --confirm
oc get istag
oc new-project images-streams-app
oc new-app --name hello -i images-streams-common/hello-world
oc get po -w
oc expose svc hello-world
oc get route
curl http://hello-images-streams-app.apps.ocp4.example.com
```
---
## Chapter 3 Lab: Building and Publishing Container Images
### Outcomes
- Build a container image locally.
- Publish a container image to a private image registry.
- Create an image stream from a container image in a private registry.
- Create an application using a new image stream.

| Application name	        | custom-server |
| ---                       | --- |
| Image name	            | custom-server:1.0.0 |
| Image registry	        | registry.ocp4.example.com:8443 |
| Image registry namespace	| developer |
| Registry username	        | developer |
| Registry password	        | developer |
| Registry email	        | developer@example.org |
| Registry secret name	    | registry-credentials |

### Containerfile
```bash
FROM registry.ocp4.example.com:8443/redhattraining/hello-world-nginx:latest
USER root
RUN sed -1 "s/nginx/OpenShift/g"/usr/share/nginx/html/index.html
USER 1001
```
### Solution
```bash
# Step 1: Build the Container image and push to the image registry
podman login -u developer -p developer registry.ocp4.example.com:8443
podman build . -t registry.ocp4.example.com:8443/developer/custom-server:1.0.0
podman images
podman push registry.ocp4.example.com:8443/developer/custom-server:1.0.0

# Step 2: Create a secret called registry-credentials
oc login -u developer -p developer https://api.ocp4.example.com:6443

oc create secret docker-registry \
registry-credentials \
--docker-server=registry.ocp4.example.com:8443 \
--docker-username=developer \
--docker-password=developer \
--docker-email=developer@example.org
secret/registry-credentials created

oc secrets link default registry-credentials --for=pull

# Step 3: Create an image stream for the custom-server:1.0.0 image
oc import-image custom-server --confirm --from registry.ocp4.example.com:8443/developer/custom-server:1.0.0
oc get is

# Step 4: Create an OpenShift application by using the custom-server image stream
oc new-app --name custom-server -i images-review/custom-server q

# Step 5: Validate the POD is running
oc get po -w
oc expose svc/custom-server
oc get route
curl http://custom-server-images-review.ocp4.example.com
```
---

## Pipeline Strategies

| Strategy | Description | Best For... |
|----------|-------------|--------------|
| **Source-to-Image (S2I)** | Injects raw application code into a pre-configured builder image (e.g., Python, Java). OpenShift automatically handles dependencies and assembly. | Developers who want to focus purely on code without managing Dockerfiles. |
| **Docker Build** | Mimics a standard `docker build` command. It expects a raw `Dockerfile` in the root of your source repository. | Legacy applications or teams that require strict control over image layers. |
| **Custom** | Allows you to supply your own custom builder image that defines specific build logic or non-standard artifacts (like RPMs). | Complex, highly customized build requirements. |
| **Pipeline** | *Note: Deprecated in newer versions in favor of OpenShift Pipelines (Tekton).* Leverages a Jenkins pipeline workflow defined in a `Jenkinsfile`. | Advanced multi-stage CI/CD orchestration. |

## Guided Exercise 4.1: Managing Application Builds
Create an application build. Build the vertx-site application from source code in Git.

### Use the following parameters for the build:
- Application name: vertx-site
- Build environment variable: MAVEN_MIRROR_URL=http://nexus-infra.apps.ocp4.example.com/java
- Environment variable: JAVA_APP_JAR=vertx-site-1.0.0-SNAPSHOT-fat.jar
- Image stream: redhat-openjdk18-openshift:1.8
- Build directory: apps/builds-applications/vertx-site
- Source code: https://git.ocp4.example.com/developer/DO288-apps 

### Syntax for new-app command
```bash
oc new-app --name=<app-name> \
  --context-dir=<subdir-path> \
  --build-env <BUILD_VAR>=<value> \
  --env <RUNTIME_VAR>=<value> \
  <git-repository-url>#[<branch-or-tag>]
```

```bash
# Create the app
oc new-app --name vertx-site \
--build-env \
MAVEN_MIRROR_URL=http://nexus-infra.apps.ocp4.example.com/java \
--env JAVA_APP_JAR=vertx-site-1.0.0-SNAPSHOT-fat.jar \
-i redhat-openjdk18-openshift:1.8 \
--context-dir apps/builds-applications/vertx-site \
https://git.ocp4.example.com/developer/DO288-apps

oc logs -f bc/vertx-site
oc get build

# After inspecting the Maven Repository, cat ~/.m2/settings.xml you discover the URL for the build-env is wrong.
...output omitted...
<url>http://nexus-infra.apps.ocp4.example.com/repository/java</url>
...output omitted...

# Reset the build-env to http://nexus-infra.apps.ocp4.example.com/repository/java
oc set env bc/vertx-site MAVEN_MIRROR_URL=http://nexus-infra.apps.ocp4.example.com/repository/java
oc start-build vertx-site
oc get po -w
oc expose svc vertx-site
oc get route
curl vertx-site-builds-applications.apps.ocp4.example.com

# If you need to fix the app and re-save the changes to GIT

```
