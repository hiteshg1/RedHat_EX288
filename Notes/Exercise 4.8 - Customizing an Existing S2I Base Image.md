# Customizing an Existing S2I Base Image

## Outcomes
- Customize the assemble and run scripts of an Apache HTTP server builder image.
- Override the default built-in scripts.

## Instructions
Use the following as the input data for the required actions:

| Parameter                 | Value |
| ---	                    | --- |
| Application name	        | bonjour |
| Apache Image	            | registry.ocp4.example.com:8443/ubi9/httpd-24 |
| Registry Username         | developer |
| Registry Password         | developer |
| OpenShift API             | https://api.ocp4.example.com:6443 |


## Tasks & Solutions:
```bash
# 1. Authenticate Podman running on the workstation by logging in to the classroom image registry.
podman login -u developer -p developer registry.ocp4.example.com:8443

# 2. Use Podman to create a container from the httpd-24 container image. Override the container entry point to run a shell.
podman run --name webserver -it  --rm registry.ocp4.example.com:8443/ubi9/httpd-24 bash

# 3. Inspect the S2I scripts packaged in the builder image. The S2I scripts are in the /usr/libexec/s2i directory.
cd /usr/libexec/s2i
cat assemble
cat run
cat usage
exit

# 4. Review the application source code with the custom S2I scripts.
cd ~/DO288/labs/builds-s2i/s2i-scripts
cat index.html

# 5. The custom S2I scripts are in the .s2i/bin directory. Inspect the assemble script.
cat .s2i/bin/assemble

...output omitted...

######## CUSTOMIZATION STARTS HERE ############
echo "---> Installing application source"
cp -Rf /tmp/src/*.html ./

DATE=`date "+%b %d, %Y @ %H:%M %p"`

echo "---> Creating info page"
echo "Page built on $DATE" >> ./info.html
echo "Proudly served by Apache HTTP Server version $HTTPD_VERSION" >> ./info.html

######## CUSTOMIZATION ENDS HERE ############
...output omitted...

# This script copies the index.html file from the application source to the web server document root at /opt/app-root/src. 
# It also creates an info.html file containing page build time and environment information.

# 6. Inspect the run script. This script changes the default log level of the startup messages in the web server to debug.
cat .s2i/bin/run

Inspect the run script.

[student@workstation s2i-scripts]$ cat .s2i/bin/run
...output omitted...
# Make Apache show 'debug' level logs during startup
exec run-httpd -e debug $@

This script changes the default log level of the startup messages in the web server to debug.

# 7. Deploy the application to a Red Hat OpenShift cluster. Verify that the custom S2I scripts are executed. 
oc login -u developer -p developer https://api.ocp4.example.com:6443

oc project builds-s2i

# 8. Ensure that the image stream tag httpd:2.4-ubi9 points to the image registry.ocp4.example.com:8443/ubi9/httpd-24:latest.
oc -n openshift get is/httpd -o jsonpath='{.spec.tags[?(@.name == "2.4-ubi9")].from}' | jq
{
  "kind": "DockerImage",
  "name": "registry.ocp4.example.com:8443/ubi9/httpd-24:latest"
}

# 9. Create an application called bonjour from the provided sources. 
#    You must prefix the Git URL with the httpd:2.4-ubi9 image stream by using the tilde (~) notation to ensure that the application uses the ubi9/httpd-24 builder image.
oc new-app --name bonjour --context-dir labs/builds-s2i/s2i-scripts httpd:2.4-ubi9~https://git.ocp4.example.com/developer/DO288-apps

# 10. Wait until the build finishes. View the build logs.
oc get build

oc logs -f bc/bonjour

# Observe that the custom S2I scripts provided by the application are executed instead of the built-in S2I scripts from the builder image.

# 11. Test the application by accessing the route. 
oc get po

oc expose svc/bonjour

oc get route

curl http://bonjour-builds-s2i.apps.ocp4.example.com

# 12. Inspect the logs for the application pod. You should see debug level log messages being displayed at startup.
oc logs deploy/bonjour
```

## Notes
### Here are the main takeaways from this exercise:

#### Default S2I Script Location:
- Standard S2I builder images package their default scripts (such as assemble, run, and usage) in the /usr/libexec/s2i directory.
#### Overriding S2I Scripts:
- You can inject custom build and run behaviors by placing your own assemble and run scripts in the .s2i/bin/ directory at the root of your application's source repository.
#### Customizing the Build and Run Phases: 
- A custom assemble script can be used to perform extra build tasks (such as generating dynamic metadata files like info.html), while a custom run script can modify runtime execution flags (such as enabling debug-level logging).
#### Explicit Builder Binding:
- When deploying an application with oc new-app, you can explicitly associate a builder image with a source repository by using the tilde (~) notation (e.g., image-stream~git-url).
#### Verification of Custom Scripts: 
- Successful execution of overridden S2I scripts can be verified by analyzing the build logs (oc logs -f bc/<name>), which will display the custom output defined in the overridden script files during the image build process.
