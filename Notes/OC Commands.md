# OC Commands Reference
---

## Table of Contents
- [OC Commands Reference](#oc-commands-reference)
  - [Table of Contents](#table-of-contents)
  - [1. Logging in OpenShift Cluster](#1-logging-in-openshift-cluster)
  - [2. Skopeo / Podman Commands](#2-skopeo--podman-commands)
  - [3. Creating, Viewing and Deleting Projects](#3-creating-viewing-and-deleting-projects)
  - [4. Creating a Secret for a Docker Registry](#4-creating-a-secret-for-a-docker-registry)
  - [5. Viewing Events](#5-viewing-events)
  - [6. OC New-App](#6-oc-new-app)
  - [7. Importing an Image Stream \& Deploying the app](#7-importing-an-image-stream--deploying-the-app)
  - [7. Triggers](#7-triggers)
  - [8. S2I](#8-s2i)
  - [9. Deleting an app](#9-deleting-an-app)
  - [10. OC Explain](#10-oc-explain)
  - [11. OC start-build and rollout](#11-oc-start-build-and-rollout)
  - [12. OC Scale](#12-oc-scale)
  - [13. Secrets and Config Maps](#13-secrets-and-config-maps)
  - [14. Service Accounts](#14-service-accounts)
  - [15. Adding Storage to Deployments](#15-adding-storage-to-deployments)
  - [16. Types of probes](#16-types-of-probes)
  - [17. Horizontal / Vertical Scaling](#17-horizontal--vertical-scaling)
  - [18. Templates](#18-templates)
  - [19. Helm Charts](#19-helm-charts)
  - [Pipeline Strategies](#pipeline-strategies)




## 1. Logging in OpenShift Cluster
- [Table of Contents](#table-of-contents)
```bash
# Shows API for logging in via CLI
oc whoami --show-server

# Shows Web URL
oc whoami --show-console

# Log in using username and password and logging in using token
oc login -u developer -p developer https://api.ocp4.example.com:6443
oc login -u developer -p $(oc whoami -t) https://api.ocp4.example.com:6443
```



## 2. Skopeo / Podman Commands
- [Table of Contents](#table-of-contents)
```bash
# PODMAN
podman login -u <username> -p <password>
podman build . -t <image-name><tag> # 
podman images
podman push registry.example.com/project/myimage:latest
podman rmi <IMAGE>
podman run -d --rm --name <name> -p <host-port>:<container-port> <image><tag>
podman run -it <IMAGE> /bin/bash
podman stop <CONTAINER_NAME or ID>
podman rm <CONTAINER_NAME or ID>
podman ps -a

# Skopeo
skopeo login --username myuser --password mypass <registry>
skopeo inspect docker://<registry:port>/user/app:tag
skopeo copy docker://SOURCE_IMAGE docker://DEST_IMAGE
skopeo delete docker://registry.example.com/project/app:old
```
---
## 3. Creating, Viewing and Deleting Projects
- [Table of Contents](#table-of-contents)
```bash 
# Create new project
oc new-project <project_name>

# List Projects
oc projects

# Delete a project
oc delete project <project_name>
```

## 4. Creating a Secret for a Docker Registry

Syntax of command and steps

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
oc get sa default -o yaml

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
- [Table of Contents](#table-of-contents)
```bash
# Stream/Watch events in real time
oc get events -w

# Filter by specific event types
oc get events --field-selector type=Warning

# Sort events by the time they occurred
oc get events --sort-by='.metadata.creationTimestamp'
```
---
## 6. OC New-App
- [Table of Contents](#table-of-contents)
The oc new-app command provides the following options to customize the application build:

** Supported Options ** 
| Option	              | Description |
| ---                   | ----        |
| --image-stream or -i  | The image stream to be used to deploy a container image |
|--strategy 	          | Manually specifies the containerization strategy, such as docker, or source |
|--code 	              | The URL to a Git repository to be used as input for an S2I build |
|--image 	              | The URL to a container image to be deployed |
|--dry-run 	            | Set to true to show the result of the operation without performing it |
|--context-dir 	        | The path to a directory inside of the git repository to be treated as the application root |

Examples
```bash
# Deploy an application from an existing OpenShift ImageStream.
oc new-app -i php:8.2 --name=myapp
oc new-app --image-stream=python:3.11 --name=python-app

# Source to Image
oc new-app https://gitlab.com/example/myapp.git --strategy=source --name=myapp
oc new-app https://gitlab.com/example/myrepo.git --context-dir=backend --strategy=source --name=backend

# Source to Image + variables 
# --build-env → available during the build process, -e → added to the deployed application container at runtime
oc new-app -i nodejs:18 --code=https://gitlab.com/example/myapp.git --name=myapp \
  --build-env NPM_MIRROR=https://registry.npmjs.org \
  -e DB_HOST=postgresql \
  -e DB_NAME=mydb \
  -e DB_USER=myuser \
  -e DB_PASSWORD=mypassword

# Docker/Containerfile build
oc new-app https://gitlab.com/example/myapp.git --strategy=docker --name=myapp

# Building from Source Code (Source code → Git repository + Builder image → nodejs:18)
oc new-app --code=https://gitlab.com/example/myapp.git -i nodejs:18 --name=myapp
oc new-app --code=https://gitlab.com/example/myapp.git#main -i nodejs:18 --name=myapp

# Deploy an existing container image directly.
oc new-app --image=quay.io/example/myapp:latest --name=myapp
oc new-app --image=registry.access.redhat.com/ubi9/httpd-24 --name=web

# Create and apply yaml file 
oc new-app -i nodejs:18 https://gitlab.com/example/myapp.git --dry-run=client -o yaml > app.yaml
oc apply -f app.yaml
```


## 7. Importing an Image Stream & Deploying the app
- [Table of Contents](#table-of-contents)
```bash
# Step 1: Create/select the project
oc new-project <project-name>

# Step 2: Import or update an ImageStreamTag for an image that lives in an external registry
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
- [Table of Contents](#table-of-contents)
```bash
# add GitLab webhook trigger
oc set triggers bc/name --from-gitlab

# remove GitLab webhook trigger
oc set triggers bc/name --from-gitlab --remove

# inspect trigger configuration and webhook URLs
oc describe bc/name
```
---
## 8. S2I

What is S2I?

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
- [Table of Contents](#table-of-contents)
```bash
# Deleting an app with label e.g. bonjour
oc delete all -l app=bonjourd
```

## 10. OC Explain
- [Table of Contents](#table-of-contents)
```bash
# oc explain only explains how API resources work. To list the api-resouces,
oc api-resources

# Example, secrets is an api resource
oc explain secrets
```

## 11. OC start-build and rollout
- [Table of Contents](#table-of-contents)
oc start-build → rebuilds the image (after git updates etc.)

oc rollout restart → recreates the pods using the current image (not necessary if the deployment has an image-chage trigger)

```bash
# Example,
oc start-build bc/oxy --follow
oc rollout restart deployment/oxy
oc rollout status deployment/oxy
```

## 12. OC Scale
- [Table of Contents](#table-of-contents)
The oc scale command scales the number of replicas for a given deployment
```bash
oc scale deployment example-deployment --replicas=3
oc get pods
```

## 13. Secrets and Config Maps
- [Table of Contents](#table-of-contents)
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

## 14. Service Accounts
- [Table of Contents](#table-of-contents)
Service accounts provide identity for applications. This means that administrators can bind roles for role-based access control (RBAC), secrets, security context constraints (SCCs), and other objects to service accounts.

Developers then associate service accounts with pods. 
```bash
# Create a service account by using the oc create command:
oc create serviceaccount my-sa

# Assign a custom service account to a deployment or a pod by using the oc set serviceaccount command:
oc set serviceaccount deployment nginx-deployment my-sa
```

## 15. Adding Storage to Deployments
Use the 'oc set volume' command to add, update, remove, or list volumes and volume mounts for any resource with a pod template (such as deployments, deployment configs, or replication controllers). 

Easiest via the GUI
```bash
# The following is an example command to create and attach a PVC to an existing deployment called my-deployment:
oc set volumes deploy/my-deployment \
--add \
--name nfs-volume-storage \
--type pvc \
--claim-mode rwo \
--claim-size 1Gi \
--mount-path /tmp/data \
--claim-name my-data-claim
```

## 16. Types of probes
- [Table of Contents](#table-of-contents)
| Probe Type | Purpose | Behavior on Failure | When It Runs | Configuration Attribute |
|------------|---------|----------------------|---------------|--------------------------|
| **Startup Probe** | Verifies whether the application within a container has started. | OpenShift kills the container and restarts it, depending on the pod's `restartPolicy`. | Runs only once, at startup, before any other probe. Other probes (readiness/liveness) don't start until this one succeeds. | `spec.containers.startupProbe` |
| **Readiness Probe** | Determines whether a container is ready to serve requests (e.g., after network connections, file/cache loading, or other initial tasks). | OpenShift stops sending traffic to that pod until the probe succeeds. | Runs periodically. | `spec.containers.readinessProbe` |
| **Liveness Probe** | Determines whether an application running in a container is in a healthy state. | OpenShift restarts the container. | Runs periodically. | `spec.containers.livenessProbe` |

```bash
# Readiness Probe
# Adds an HTTP GET readiness check hitting port 8080 at /readyz. Checks every 20 seconds (--period-seconds). 
# If it fails, OpenShift stops routing traffic to the pod until it passes again — the pod itself isn't restarted.
oc set probe deployment/myapp \
--readiness \
--get-url=http://:8080/readyz \
--period-seconds=20

# Liveness Probe TCP Check
# Uses a TCP socket check instead of HTTP — just verifies port 3306 (commonly MySQL) accepts connections.
# Runs every 20 seconds.
# Each check attempt must respond within 1 second (--timeout-seconds) or it's counted as a failure.
# If it fails enough times, the container gets restarted.
oc set probe deployment/myapp \
--liveness \
--open-tcp=3306 \
--period-seconds=20 \
--timeout-seconds=1

# Liveness Probe HTTP Check. 
# HTTP GET check against /livez on port 8080.
# Waits 30 seconds after container start before running the first check (--initial-delay-seconds) — gives the app time to boot.
# Needs just 1 successful check to be considered healthy (--success-threshold).
# Needs 3 consecutive failures (--failure-threshold) before OpenShift restarts the container.
oc set probe deployment/myapp \
--liveness \
--get-url=http://:8080/livez \
--initial-delay-seconds=30 \
--success-threshold=1 \
--failure-threshold=3
```

## 17. Horizontal / Vertical Scaling
- [Table of Contents](#table-of-contents)

Horizontal Pod Autoscaler (HPA)

Scales out/in — it changes the number of pod replicas running for a deployment/replicaset/statefulset.

If CPU, memory, or a custom metric (e.g., requests per second) exceeds a target threshold, HPA spins up more pods to share the load.
If demand drops, it scales the replica count back down.
Good for stateless apps that can run multiple identical copies behind a service/load balancer.
```bash
oc autoscale deployment/myapp --min=2 --max=10 --cpu-percent=70
```
This keeps between 2–10 replicas of myapp, adding pods when average CPU exceeds 70%.

Vertical Pod Autoscaler (VPA)

Scales up/down — it changes the resource requests/limits (CPU & memory) of individual pods, rather than the number of pods.

Monitors actual usage over time and recommends (or automatically applies) more appropriate CPU/memory requests.
Useful for workloads that can't easily be horizontally scaled (e.g., a single-instance database, or an app that isn't built to run multiple replicas).
Typically requires pod restarts to apply new resource values (since resource requests are set at pod creation).

## 18. Templates
- [Table of Contents](#table-of-contents)

Templating Commands
```bash
# List templates
oc get templates

# Inspect template
oc describe template <name>
oc get template <name> -o yaml

# CREATE TEMPLATE RESOURCE
oc create -f template.yaml

# INSPECT PARAMETERS
oc process -f template.yaml --parameters

# PROCESS ONLY — DOES NOT CREATE RESOURCES
oc process -f template.yaml \
  -p PARAM=value

oc process -f template.yaml \
  -p PARAM=value \
  -o yaml

# PROCESS + CREATE
oc process -f template.yaml \
  -p PARAM=value \
  | oc create -f -

# DEPLOY DIRECTLY FROM TEMPLATE FILE
oc new-app -f template.yaml \
  -p PARAM=value

# DEPLOY TEMPLATE STORED IN CLUSTER
oc new-app --template=<template-name> \
  -p PARAM=value

# SAVE PROCESSED RESOURCES

oc process -f template.yaml \
  -p PARAM=value \
  -o yaml > resources.yaml

oc create -f resources.yaml
```

YAML skeleton I'd memorize is only:
```bash
apiVersion: template.openshift.io/v1
kind: Template

metadata:
  name: my-template

objects:

- apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: ${APP_NAME}
  spec:
    # ...

- apiVersion: v1
  kind: Service
  metadata:
    name: ${APP_NAME}
  spec:
    # ...

parameters:

- name: APP_NAME
  description: Application name
  required: true

- name: PASSWORD
  generate: expression
  from: "[a-zA-Z0-9]{12}"

labels:
  app: ${APP_NAME}
```

The six things I'd make sure you can do without notes
1. Recognize kind: Template.
2. Know that resources go under objects:, not spec:.
3. Create and reference a parameter with ${PARAMETER}.
4. Discover parameters with oc process -f file.yaml --parameters.
5. Understand that oc process generates resources but doesn't create them.
6. Deploy from either a file with oc new-app -f or a stored template with oc new-app --template.


## 19. Helm Charts
- [Table of Contents](#table-of-contents)




## Pipeline Strategies
- [Table of Contents](#table-of-contents)

| Strategy | Description | Best For... |
|----------|-------------|--------------|
| **Source-to-Image (S2I)** | Injects raw application code into a pre-configured builder image (e.g., Python, Java). OpenShift automatically handles dependencies and assembly. | Developers who want to focus purely on code without managing Dockerfiles. |
| **Docker Build** | Mimics a standard `docker build` command. It expects a raw `Dockerfile` in the root of your source repository. | Legacy applications or teams that require strict control over image layers. |
| **Custom** | Allows you to supply your own custom builder image that defines specific build logic or non-standard artifacts (like RPMs). | Complex, highly customized build requirements. |
| **Pipeline** | *Note: Deprecated in newer versions in favor of OpenShift Pipelines (Tekton).* Leverages a Jenkins pipeline workflow defined in a `Jenkinsfile`. | Advanced multi-stage CI/CD orchestration. |

---















<br>

