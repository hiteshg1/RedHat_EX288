# Selecting the Appropriate Deployment Strategy

## Outcomes
- Observe the behavior of both the rolling and recreate deployment strategies.

## Instructions
Use the following as the input data for the required actions:

| Parameter                 | Value |
| ---	                    | --- |
| Project Name	            | deployments-strategy |
| Application Name	        | users-db |
| Repo URL                  | https://git.ocp4.example.com/developer/DO288-apps |
| Context Dir               | apps/deployments-strategy/users-db |
| MYSQL_USER:               | developer |
| MYSQL_PASSWORD:           | redhat |
| MYSQL_DATABASE:           | usersMY |

#### Instrctions
- Create the application, users-db based on the details above.
- Scale the Deployment to 5 replicas.
- Change the deployment strategy to Recreate and rollout the app again

## Tasks & Solution
```bash
# 1. Log in to OpenShift as the developer user, ensure that you use the deployments-strategy project.
oc login -u developer -p developer https://api.ocp4.example.com:6443
oc project deployments-strategy

# 2. Create an OpenShift application by using the sources from the users-db application in the classroom Git repository and deploy it to the cluster.
oc new-app --name users-db \
-e MYSQL_USER=developer \
-e MYSQL_PASSWORD=redhat \
-e MYSQL_DATABASE=users \
https://git.ocp4.example.com/developer/DO288-apps \
--context-dir=apps/deployments-strategy/users-db \
-o yaml > application.yaml

oc apply -f application.yaml
oc get pods -w

# 3. Scale the deployment to have five replicas of the database.
oc scale --replicas=5 deploy/users-db

# 4. Observe the default rolling update strategy in action.
oc get -o yaml deploy/users-db
oc get pods -w

# 5. Manually rollout new pods. Change the deployment strategy to Recreate by editing the application.yaml manifest.
oc rollout restart deploy/users-db
vim application.yaml

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


# 6. Run the oc apply command to update the deployment resource. Manually rollout new pods.
oc apply -f application.yaml
oc rollout restart deploy/users-db
```