# OC Commands Reference
---

## 1. Logging in OpenShift Cluster
```bash
# Shows API for logging in via CLI
oc whoami --show-server

# Shows Web URL
oc whoami --show-console

# Log in using username and password and logging in using token
oc login -u developer -p developer https://api.ocp4.example.com:6443
oc login -u developer -p $(oc whoami -t) https://api.ocp4.example.com:6443
```

## 2. Log in via Skopeo
```bash
skopeo login --username myuser --password mypass <registry>
skopeo inspect docker://<registry:port>/user/app:tag

# Example
skopeo login registry.ocp4.example.com:8443 -u developer -p developer
skopeo inspect docker://registry.ocp4.example.com:8443/redhattraining/hello-world-nginx
```
---
## 3. Creating, Viewing and Deleting Projects
```bash 
oc new-project <project_name>
oc get projects
oc delete project <project_name>
```

## 4. Creating a Secret for a Docker Registry
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
## 5. Viewing Events
```bash
# Stream/Watch events in real time
oc get events -w

# Filter by specific event types
oc get events --field-selector type=Warning

# Sort events by the time they occurred
oc get events --sort-by='.metadata.creationTimestamp'
```
---
## 6. Importing an Image Stream & Deploying the app
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
## 7. Triggers
```bash
# add/remove a GitLab webhook to a build configuration
oc set triggers bc/name --from-gitlab
oc set triggers bc/name --from-gitlab --remove

# To retrieve a webhook URL
oc describe bc/name
```
---
## 8. S2I
### What is S2I?
Instead of writing a Containerfile, S2I uses a builder image that already knows how to build and run a particular type of application. Examples of builder images include Node.js, Python, PHP and httpd-24.
```bash
Application Source Code
        +
S2I Builder Image
        ↓
      Build
        ↓
Runnable Application Image
        ↓
Deployment → Pod
```
``` bash
# How to identify an S2I builder
skopeo inspect docker://<registry>/<image>:<tag> | grep -i s2i
podman inspect <image>

# Create S2I application
oc new-app --name=<app> <builder-image>~<git-repo>

# Private Git repository
oc create secret generic <secret> --from-literal=username=<user> --from-literal=password=<password>
oc new-app --name=<app> --source-secret=<secret> <builder-image>~<git-repo>

# Example
oc new-app registry.example.com/ubi9/httpd-24~https://git.example.com/user/app.git
```
---

## 9. Deleting an app
```bash
# Deleting an app with label e.g. bonjour
oc delete all -l app=bonjourd
```

## 10. OC Explain
```bash
# oc explain only explains how API resources work. To list the api-resouces,
oc api-resources

# Example, secrets is an api resource
oc explain secrets

```

## 11. OC Rollout
The oc rollout command provides the cancel, pause, undo, retry, and more options for your deployments.
```bash
oc rollout status deployment example-deployment
oc rollout undo deployment example-deployment
oc rollout pause deployment example-deployment
oc rollout resume deployment example-deployment
oc rollout --help
```

## 11. OC Scale
The oc scale command scales the number of replicas for a given deployment
```bash
oc scale deployment example-deployment --replicas=3
oc get pods
```

## 12. Secrets and Config Maps
Depending on the sensitivity of the data, you can use the configuration map (ConfigMap) or secret (Secret) OpenShift objects to externalize the data.

Use secrets to store sensitive information, such as passwords, keys, and tokens.
```bash
# Similarly to secrets, you can create configuration maps by using the oc create command:
oc create configmap example-cm --from-literal key1=value1 --from-literal key2=value2

# You can also create configuration maps from a file 
oc create configmap example-cm --from-file=redis.conf

# Developers might also rename the key, such as:
oc create configmap example-cm \
--from-file=primary=/etc/redis/redis.conf \
--from-file=replica=replica-redis.conf

# To view details of a resource, use the oc get command. The -o yaml parameter displays the resource in the YAML language.
oc get secret mysecret -o yaml

# To edit a resource, use the oc edit command:
oc edit configmap my-cm

# Patching a resource refers to updating the resource by applying a set of changes rather than interactively. 
oc patch configmap/my-cm --patch '{"data":{"key1":"newvalue1"}}'

# Base64 encoding / decoding
echo -n 'hunter3' | base64
echo -n 'aHVudGVyMw==' | base64 --decode

# Use the oc extract command to extract the contents of a configuration map or a secret to a directory
oc extract secret/my-secret --to=/tmp/secret

# Injecting Data into Pods
oc set env deployment my-deployment --from configmap/my-cm
```

## 13. Service Accounts
Service accounts provide identity for applications. This means that administrators can bind roles for role-based access control (RBAC), secrets, security context constraints (SCCs), and other objects to service accounts.

Developers then associate service accounts with pods. 
```bash
# Create a service account by using the oc create command:
oc create serviceaccount my-sa

# Assign a custom service account to a deployment or a pod by using the oc set serviceaccount command:
oc set serviceaccount deployment nginx-deployment my-sa


```



## Pipeline Strategies

| Strategy | Description | Best For... |
|----------|-------------|--------------|
| **Source-to-Image (S2I)** | Injects raw application code into a pre-configured builder image (e.g., Python, Java). OpenShift automatically handles dependencies and assembly. | Developers who want to focus purely on code without managing Dockerfiles. |
| **Docker Build** | Mimics a standard `docker build` command. It expects a raw `Dockerfile` in the root of your source repository. | Legacy applications or teams that require strict control over image layers. |
| **Custom** | Allows you to supply your own custom builder image that defines specific build logic or non-standard artifacts (like RPMs). | Complex, highly customized build requirements. |
| **Pipeline** | *Note: Deprecated in newer versions in favor of OpenShift Pipelines (Tekton).* Leverages a Jenkins pipeline workflow defined in a `Jenkinsfile`. | Advanced multi-stage CI/CD orchestration. |

---















<br>

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
<br>

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
git commit -am "Modify the application version"
git push
oc start-build --follow vertx-site
```
---
<br>

## Guided Exercise 4.2: Triggering Builds
### Outcomes
- Deploy an application by using a builder image and a source code.
- Trigger a new build of the application when the builder image changes.

Lab Details:
| Key         | Value |
| ---         | --- |
| Gitlab Repo | https://git.ocp4.example.com/developer/builds-triggers|
| Gitlab Username | developer |
| Gitlab Password | d3v3lop3r |
| Gitlab secret   | gitlab    |
| Image Repo      | registry.ocp4.example.com:8443/ubi8/httpd-24 |


```bash
# Create gitlab secret
oc create secret generic gitlab --from-literal=username=developer --from-literal=password=d3v3lop3r

# Deploy an application from the GitLab repository builds-triggers. 
# Set builds-triggers as the application name, and use ubi8/httpd-24 as the base image.
IMAGE=registry.ocp4.example.com:8443
GIT_REPO=https://git.ocp4.example.com/developer/builds-triggers

oc new-app --name builds-triggers --source-secret gitlab $IMAGE~$GIT_REPO

# Monitor Build and confirm its using the UBI8 httpd-24 image
oc get pods -w
oc rsh svc/builds-triggers cat /etc/redhat-release

# Set a build trigger
oc set triggers bc/builds-triggers

# Set the Image Stream to use UBI9 image
oc tag registry.ocp4.example.com:8443/ubi9/httpd-24:latest httpd-24:latest

# Your should notice a 2nd build triggered. When you rsh into the container, it should use a UBI9 image
oc get builds

# Confirming Triggers have been set, look for triggers
oc get bc/builds-triggers -o yaml | grep trigger
```
---
<br>

## Chapter 4 Lab: Managing Red Hat OpenShift Builds
### Outcomes
- Create, start, and rebuild application builds in Red Hat OpenShift.
- Debug and fix failed OpenShift builds.

### Instructions

Your task is to deploy the expense-service application to Red Hat OpenShift. Because your OpenShift cluster does not contain an S2I base image that is compatible with the application, your colleague provided you with the source code for the application and a Dockerfile file.

Use the following information to deploy the application into the OpenShift cluster.
| Description	| Value |
| ---	| --- |
| Application name	| expense-service |
| Source code location	| https://git.ocp4.example.com/developer/DO288-apps |
| Source code directory	| apps/builds-review/expense-service |
| Build strategy	| Docker |
| Application URL	| http://expense-service-builds-review.apps.ocp4.example.com |
| GitLab username	| developer |
| GitLab password	| d3v3lop3r |

### Dockerfile
```bash
Dockerfile
FROM registry.ocp4.example.com:8443/redhattraining/ocpdev-ubi8-openjdk-17-base:1.16

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src .
RUN mvn clean package

CMD ["java", "-jar", "target/expense-service-1.0.0-SNAPSHOT-runner.jar"]
```
### Step by Step Guide
```bash
# Log in to OpenShift.
oc login -u developer -p developer https://api.ocp4.example.com:6443
oc project builds-review

# Create the application in OpenShift, which includes creating a BuildConfig. The app has a bug.
oc new-app --name expense-service --strategy Docker \
--context-dir apps/builds-review/expense-service \
https://git.ocp4.example.com/developer/DO288-apps

oc logs deploy/expense-service
# Error: Unable to access jarfile target/expense-service-1.0.0-SNAPSHOT-runner.jar

# You can launch a debug pod and verify if target/expense-service-1.0.0-SNAPSHOT-runner.jar exist
oc debug deploy/expense-service
$ ls target/

# There is no expense-service-1.0.0-SNAPSHOT-runner.jar file in the target folder. Maven will need to recompile the application
# mvn clean package, builds the JAR/WAR file and leaves it exclusively inside your local project's /target folder.
mvn clean package

# Edit the Dockerfile, amend COPY src . to COPY src src and push back to git
git commit -am "Fixed COPY src src in Dockerfile"
git push

# Re-depoly the application
oc start-build bc/expense-service --follow

# Validation
oc get pods
oc expose svc/expense-service
oc get route
curl -s expense-service-builds-review.apps.ocp4.example.com/expenses | jq
```
---
<br>

## Exersise 5.1:  Selecting the Appropriate Deployment Strategy
### Outcomes
- Observe the behavior of both the rolling and recreate deployment strategies.

### Application Spec
| Name | Value |
| --- | --- |
| Application Name      | users-db |
| MYSQL_USER: developer | Value |
| MYSQL_PASSWORD        | redhat |
| MYSQL_DATABASE        | users |
| Repository URL        | https://git.ocp4.example.com/developer/DO288-apps |
| Repository context    | apps/deployments-strategy/users-db |

```bash
# Use the oc new-app command with the -o yaml option to create a manifest for the app
oc new-app --name users-db \
-e MYSQL_USER=developer \
-e MYSQL_PASSWORD=redhat \
-e MYSQL_DATABASE=users \
https://git.ocp4.example.com/developer/DO288-apps \
--context-dir=apps/deployments-strategy/users-db \
-o yaml > application.yaml

# Create the application in the cluster by running the oc apply command with the -f option to provide the application.yaml file.
oc apply -f application.yaml

# Scale the deployment to have five replicas of the database.
oc scale --replicas=5 deploy/users-db

# Observer the strategy
[student@workstation users-db]$ oc get -o yaml deploy/users-db
apiVersion: apps/v1
kind: Deployment
metadata:
  ...output omitted...
spec:
  ...output omitted...
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      annotations:
...output omitted...

# Change the deployment strategy to Recreate by editing the application.yaml manifest.
- apiVersion: apps/v1
  kind: Deployment
  metadata:
...output omitted...
    name: users-db
  spec:
    replicas: 5
    selector:
      matchLabels:
        deployment: users-db
    strategy:
      type: Recreate
      recreateParams:
        post:
          failurePolicy: Abort
          execNewPod:
            containerName: users-db
            command: ["/post-deploy/import.sh"]
    template:
      metadata:
...output omitted...

# Run the oc apply command to update the deployment resource.
oc apply -f application.yaml

# Manually rollout new pods. 
oc rollout restart deploy/users-db
```