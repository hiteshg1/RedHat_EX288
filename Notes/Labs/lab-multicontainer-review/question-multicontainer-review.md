# Lab: Deploying Multi-container Applications

- Create a Helm chart to deploy a multi-container application.
- Customize a multi-container application for different environments with Kustomize.

### Outcomes
- Create a Helm chart from manifest files.
- Use Kustomize for local updates on a Helm chart.

### Instructions

The lab script copies the Helm chart files for the famous-quotes application, which uses a Redis data store.

In this lab, you are asked to create a Helm chart by using the files that the exercise provides and later using Kustomize to apply customization to the rendered chart. You are expected to work with Helm locally, without the need for a Helm repository.

----

### 1. Log in to Red Hat OpenShift.
1.1 Log in to OpenShift as the developer user.

1.2 Ensure that you use the multicontainer-review project.



### 2. Create a Helm chart from the files in the ~/DO288/labs/multicontainer-review/famous-quotes directory.

2.1 In a terminal window, change to the famous-quotes application directory.

2.2 Move the files in the famous-quotes directory according to the Helm chart layout.

2.3 Verify that the famous-quotes templates and the Redis chart are in the correct location.

----

### 3. Update the Helm templates to use the values in the quotes key of the values.yaml file.

Add the following features to the chart:
- Parameterize the famous-quotes image name.
- Use the quotes.import.enabled value to optionally add the volume and the import configuration to the famous-quotes deployment.
- Use the quotes.import.enabled value to optionally create the configuration map that contains the import data.

3.1 Edit the templates/deployment.yaml template to use the quotes.image value.

3.3 Verify that the updates to the templates/deployment.yaml file render correctly.

3.4 Edit the templates/configmap.yaml template to use the quotes.import.enabled value to conditionally create the quotes-import-data configuration map.

3.5 Run the helm template with the quotes.import.enabled parameter set to false to verify that the configuration map does not render.

----

### 4. Use the output of the local famous-quotes chart render to create the ~/DO288/labs/multicontainer-review/kustomized-quotes/base/app.yaml file.

----
### 5. Add the required files to the kustomized-quotes directory to have working staging and production customizations for the famous-quotes application.

5.1 Change to the kustomized-quotes directory.

5.2 Create the base/kustomization.yaml file with the following content:

5.3 Verify that you can run oc kustomize with the base directory.

5.4 Create the overlays/staging/kustomization.yaml file with the following content:

5.5 Verify that you can run oc kustomize with the overlays/staging directory.

5.6 Create the overlays/production/kustomization.yaml file with the following content:

5.7 Verify that you can run oc kustomize with the overlays/production directory.

5.8 Verify the directory structure.

----

### 6. Deploy the staging version of the application.

6.1 Run the following command to deploy the staging version of the application.

6.2 Verify that the application and the Redis pods are running.

6.3 Use the curl command to test that the application works. (curl famous-quotes-multicontainer-review.apps.ocp4.example.com/quotes/5)
