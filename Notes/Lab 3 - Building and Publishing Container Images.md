# Building and Publishing Container Images
## Outcomes
- Build a container image locally.
- Publish a container image to a private image registry.
- Create an image stream from a container image in a private registry.
- Create an application using a new image stream.

## Instructions

Use the following as the input data for the required actions:

| Parameter        | Value |
| ---	        | --- |
| Application name	        | custom-server |
| Image name	            | custom-server:1.0.0 |
| Image registry	        | registry.ocp4.example.com:8443 |
| Image registry namespace	| developer |
| Registry username	        | developer |
| Registry password	        | developer |
| Registry email	        | developer@example.org |
| Registry secret name	    | registry-credentials |

## Container File
```bash
FROM registry.ocp4.example.com:8443/redhattraining/hello-world-nginx:latest

USER root

RUN sed -i "s/nginx/OpenShift/g" /usr/share/nginx/html/index.html

USER 1001
```

## Tasks: 
```bash
1. Review the Containerfile contents.
2. Log in to the classroom container registry.
3. Build the container image.
4. Push the custom-server image to the classroom private registry under the developer namespace.
5. Create a secret called registry-credentials to access the private registry by using the data that the exercise provides.
6. Ensure that you are in the images-review project.
7. Create the registry-credentials secret of the docker-registry type that contains the credentials.
8. Link the secret to the default service account.
9. Create an image stream for the custom-server:1.0.0 image that you pushed to the classroom registry.
10. Create an OpenShift application by using the custom-server image stream.
11. Validate that the application works by using the route URL and by verifying that the Hello, world from OpenShift! string shows in the response.
```

## Solution:
### Steps 1 - 4
```bash
# 1. Review the Containerfile contents.
cat Containerfile

# 2. Log in to the classroom container registry.
podman login -u developer -p developer registry.ocp4.example.com:8443

# 3. Build the container image.
podman build . -t registry.ocp4.example.com:8443/developer/custom-server:1.0.0

# 4. Push the custom-server image to the classroom private registry under the developer namespace.
podman push registry.ocp4.example.com:8443/developer/custom-server:1.0.0
```

### Steps 5 - 8
```bash
# 5. Create a secret called registry-credentials to access the private registry by using the data that the exercise provides.
# 6. Ensure that you are in the images-review project.
# 7. Create the registry-credentials secret of the docker-registry type that contains the credentials.
oc login -u developer -p developer https://api.ocp4.example.com:6443

oc project images-review

oc create secret docker-registry \
registry-credentials \
--docker-server=registry.ocp4.example.com:8443 \
--docker-username=developer \
--docker-password=developer \
--docker-email=developer@example.org

# TIPS: Easier via the GUI, Secrets > Create Image Pull Secret 

# 8. Link the secret to the default service account.
oc secrets link default registry-credentials --for=pull
```

### Steps 9 - 11
```bash
# 9. Create an image stream for the custom-server:1.0.0 image that you pushed to the classroom registry.
oc import-image custom-server --confirm --from registry.ocp4.example.com:8443/developer/custom-server:1.0.0

# Validate
oc get is
oc get istag

# 10. Create an OpenShift application by using the custom-server image stream.
oc new-app --name custom-server -i images-review/custom-server

# TIPS: Easier via the GUI, Add > Container Images > Image stream tag from internal registry + add the route as well for step 11

# 11. Validate that the application works by using the route URL and by verifying that the Hello, world from OpenShift! string shows in the response.
oc expose svc custom-server
oc get route
curl http://custom-server-images-review.apps.ocp4.example.com
```