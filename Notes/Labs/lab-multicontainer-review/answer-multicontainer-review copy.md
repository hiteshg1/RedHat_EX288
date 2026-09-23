# Lab: Deploying Multi-container Applications

- Create a Helm chart to deploy a multi-container application.
- Customize a multi-container application for different environments with Kustomize.

### Outcomes
- Create a Helm chart from manifest files.
- Use Kustomize for local updates on a Helm chart.


### Instructions

The lab script copies the Helm chart files for the famous-quotes application, which uses a Redis data store.

In this lab, you are asked to create a Helm chart by using the files that the exercise provides and later using Kustomize to apply customization to the rendered chart. You are expected to work with Helm locally, without the need for a Helm repository.

#### 1. Log in to Red Hat OpenShift.
1.1 Log in to OpenShift as the developer user.
```bash
oc login -u developer -p developer https://api.ocp4.example.com:6443
```

1.2 Ensure that you use the multicontainer-review project.

```bash
oc new-project multicontainer-review
```

2. Create a Helm chart from the files in the ~/DO288/labs/multicontainer-review/famous-quotes directory.

2.1 In a terminal window, change to the famous-quotes application directory.
```bash
cd ~/DO288/labs/multicontainer-review/famous-quotes
```

2.2 Move the files in the famous-quotes directory according to the Helm chart layout.

First, move the chart template files to the templates directory.
```bash
mv \
configmap.yaml \
deployment.yaml \
route.yaml \
service.yaml \
templates/
```
Then, move the pre-downloaded chart dependency to the charts directory.
```bash
mv redis-persistent-0.0.1.tgz charts/
```

When you run the tree command, you must get the following output:
```bash
tree ./
```
Expected Output:
```bash
./
├── Chart.yaml
├── charts
│   └── redis-persistent-0.0.1.tgz
├── templates
│   ├── configmap.yaml
│   ├── deployment.yaml
│   ├── route.yaml
│   └── service.yaml
└── values.yaml

2 directories, 7 files
```

2.3 Verify that the famous-quotes templates and the Redis chart are in the correct location.
```bash
helm template ./ | grep  "# Source:" | sort
```
```bash
# Source: famous-quotes/charts/redis/templates/deployment.yaml
# Source: famous-quotes/charts/redis/templates/persistentvolumeclaim.yaml
# Source: famous-quotes/charts/redis/templates/secret.yaml
# Source: famous-quotes/charts/redis/templates/service.yaml
# Source: famous-quotes/charts/redis/templates/tests/test-redis-connection.yaml
# Source: famous-quotes/templates/configmap.yaml
# Source: famous-quotes/templates/deployment.yaml
# Source: famous-quotes/templates/route.yaml
# Source: famous-quotes/templates/service.yaml
```

3. Update the Helm templates to use the values in the quotes key of the values.yaml file.

Add the following features to the chart:
- Parameterize the famous-quotes image name.
- Use the quotes.import.enabled value to optionally add the volume and the import configuration to the famous-quotes deployment.
- Use the quotes.import.enabled value to optionally create the configuration map that contains the import data.

3.1 Edit the templates/deployment.yaml template to use the quotes.image value.
```bash
...output omitted...
spec:
  containers:
  - name: famous-quotes
image: {{ .Values.quotes.image }}
...output omitted...

Edit the templates/deployment.yaml template to make the data import configuration and volume optional.

...output omitted...
- name: DATASTORE_PASS
  valueFrom:
secretKeyRef:
  key: database-password
  name: {{ .Values.redis.database_service_name }}
  {{- if .Values.quotes.import.enabled }}
- name: QUOTES_IMPORT_PATH
  value: /tmp/quotes/import_quotes.csv
volumeMounts:
  - name: import-volume
mountPath: /tmp/quotes
  volumes:
- name: import-volume
  configMap:
name: quotes-import-data
  {{- end }}
```

3.3 Verify that the updates to the templates/deployment.yaml file render correctly.

Verify that the image value displays and that there is no data import configuration.
```bash
helm template ./ --set quotes.import.enabled=false | grep -A 28 "famous-quotes/templates/deployment.yaml"
```
Expected Output:
```bash
# Source: famous-quotes/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: famous-quotes
...output omitted...
      containers:
      - name: famous-quotes
image: registry.ocp4.example.com:8443/redhattraining/ocpdev-redis-quotes:4.18
imagePullPolicy: Always
env:
- name: DATASTORE_HOST
  value: quotes-store
- name: DATASTORE_PASS
  valueFrom:
    secretKeyRef:
      key: database-password
      name: quotes-store
---
# Source: famous-quotes/charts/redis/templates/deployment.yaml
```

3.4 Edit the templates/configmap.yaml template to use the quotes.import.enabled value to conditionally create the quotes-import-data configuration map.
```bash
{{- if .Values.quotes.import.enabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: quotes-import-data
data:
  import_quotes.csv: |-
    id|quote|author
...output omitted...
    8|Those who can imagine anything, can create the impossible.|Alan Turing
{{- end }}
```

3.5 Run the helm template with the quotes.import.enabled parameter set to false to verify that the configuration map does not render.
```bash
helm template ./ --set quotes.import.enabled=false | grep "# Source\|templates/configmap.yaml"
```
Expected Output:
```
# Source: famous-quotes/charts/redis/templates/secret.yaml
# Source: famous-quotes/charts/redis/templates/persistentvolumeclaim.yaml
# Source: famous-quotes/charts/redis/templates/service.yaml
# Source: famous-quotes/templates/service.yaml
# Source: famous-quotes/templates/deployment.yaml
# Source: famous-quotes/charts/redis/templates/deployment.yaml
# Source: famous-quotes/templates/route.yaml
# Source: famous-quotes/charts/redis/templates/tests/test-redis-connection.yaml
```
Optionally, run the previous command with the quotes.import.enabled=true parameter to verify that the configuration map shows in the output.

4. Use the output of the local famous-quotes chart render to create the ~/DO288/labs/multicontainer-review/kustomized-quotes/base/app.yaml file.

Use the --skip-tests option for the helm template command to avoid rendering the chart in the app.yaml file.
```bash
helm template --skip-tests ./ > ../kustomized-quotes/base/app.yaml
```

5. Add the required files to the kustomized-quotes directory to have working staging and production customizations for the famous-quotes application.

The ~/DO288/labs/multicontainer-review/kustomized-quotes directory contains the base and overlays directory convention, but is missing some files that Kustomize requires.
```bash
kustomized-quotes
├── base
│   └── app.yaml # Generated in the Helm part of the exercise
└── overlays
├── production
│   └── prod_dimensioning.yaml
└── staging
        └── staging_dimensioning.yaml
```

5.1 Change to the kustomized-quotes directory.
```bash
cd multicontainer-review/kustomized-quotes
```

5.2 Create the base/kustomization.yaml file with the following content:
```bash
resources:
- app.yaml
```

5.3 Verify that you can run oc kustomize with the base directory.
```bash
oc kustomize base/
```
Expected Output:
```bash
apiVersion: v1
data:
  import_quotes.csv: |-
...output omitted...
```

5.4 Create the overlays/staging/kustomization.yaml file with the following content:
```bash
resources:
- ../../base
patches:
- path: staging_dimensioning.yaml
```

5.5 Verify that you can run oc kustomize with the overlays/staging directory.
```bash
oc kustomize overlays/staging
```
Expected Output:
```bash        
apiVersion: v1
data:
  import_quotes.csv: |-
    id|quote|author
...output omitted...
```
        
5.6 Create the overlays/production/kustomization.yaml file with the following content:
```bash
resources:
- ../../base
patches:
- path: prod_dimensioning.yaml
```

5.7 Verify that you can run oc kustomize with the overlays/production directory.
```bash
oc kustomize overlays/production
apiVersion: v1
data:
  import_quotes.csv: |-
    id|quote|author
...output omitted...
```

5.8 Verify the directory structure.
```bash
tree ./
```
Expected Output:
```bash
./
├── base
│   ├── app.yaml
│   └── kustomization.yaml
└── overlays
    ├── production
    │   ├── kustomization.yaml
    │   └── prod_dimensioning.yaml
    └── staging
├── kustomization.yaml
└── staging_dimensioning.yaml

4 directories, 6 files
```

6. Deploy the staging version of the application.

6.1 Run the following command to deploy the staging version of the application.
```bash
oc apply -k overlays/staging
```
Expected Output:
```bash
configmap/quotes-import-data created
secret/quotes-store created
service/famous-quotes created
service/quotes-store created
persistentvolumeclaim/quotes-store created
deployment.apps/famous-quotes created
deployment.apps/quotes-store created
route.route.openshift.io/famous-quotes created
```

6.2 Verify that the application and the Redis pods are running.
```bash
        oc get pod
```
Expected Output:
```bash
NAME                            READY   STATUS      RESTARTS      AGE
famous-quotes-594b98b4b-jjqdv   1/1     Running   1 (11s ago)   36s
quotes-store-6578b657c-z4kvz    1/1     Running   0             36s
```

6.3 Use the curl command to test that the application works.
```bash
curl famous-quotes-multicontainer-review.apps.ocp4.example.com/quotes/5
```
Expected Output:
```bash
{
  "quote" : "Imagination is more important than knowledge.",
  "author" : "Albert Einstein",
  "_links" : {
    "self" : {
      "href" : "http://famous-quotes-multicontainer-review.apps.ocp4.example.com/quotes/5"
    },
    "quote" : {
      "href" : "http://famous-quotes-multicontainer-review.apps.ocp4.example.com/quotes/5"
    }
  }
}
```