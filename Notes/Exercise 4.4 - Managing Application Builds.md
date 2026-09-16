# Managing Application Builds
## Outcomes
- Use the CLI to manage builds on OpenShift.

## Instructions
Use the following as the input data for the required actions:

| Parameter                     | Value |
| ---	                        | --- |
| Application name	            | vertx-site |
| Build environment variable	| MAVEN_MIRROR_URL=http://nexus-infra.apps.ocp4.example.com/java |
| Environment variable          | JAVA_APP_JAR=vertx-site-1.0.0-SNAPSHOT-fat.jar|
| Image stream	                | redhat-openjdk18-openshift:1.8 |
| Build directory	            | apps/builds-applications/vertx-site |
| Source code	                | https://git.ocp4.example.com/developer/DO288-apps |

The application dir has the following files, 
```bash
ansible@fedora-prd-rnd:~/DO288-apps/apps/pipelines-review/vertx-site$ tree .
.
├── pom.xml
├── README.adoc
└── src
    ├── main
    │   └── java
    │       └── com
    │           └── redhat
    │               └── vertx_site
    │                   └── MainVerticle.java
    └── test
        └── java
            └── com
                └── redhat
                    └── tests
                        └── VertxSiteTest.java
```

### pox.xml
Notice the maven-shade-plugin configuration:

The build process creates the vertx-site-1.0.0-SNAPSHOT-fat.jar shaded JAR file, which you can execute by using the java -jar command.
```bash
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.redhat</groupId>
  <artifactId>vertx-site</artifactId>
  <version>1.0.0-SNAPSHOT</version>

  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>

    <maven-compiler-plugin.version>3.8.1</maven-compiler-plugin.version>
    <maven-shade-plugin.version>3.2.4</maven-shade-plugin.version>
    <maven-surefire-plugin.version>3.0.0-M5</maven-surefire-plugin.version>
    <exec-maven-plugin.version>3.0.0</exec-maven-plugin.version>

    <vertx.version>4.4.4</vertx.version>
    <junit-jupiter.version>5.9.1</junit-jupiter.version>

    <main.verticle>com.redhat.vertx_site.MainVerticle</main.verticle>
    <launcher.class>io.vertx.core.Launcher</launcher.class>
  </properties>

  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>io.vertx</groupId>
        <artifactId>vertx-stack-depchain</artifactId>
        <version>${vertx.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>

  <dependencies>
    <dependency>
      <groupId>io.vertx</groupId>
      <artifactId>vertx-core</artifactId>
    </dependency>
    <dependency>
      <groupId>io.vertx</groupId>
      <artifactId>vertx-web</artifactId>
    </dependency>

    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.12</version>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>io.vertx</groupId>
      <artifactId>vertx-unit</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>${maven-compiler-plugin.version}</version>
        <configuration>
          <source>1.8</source>
          <target>1.8</target>
          <verbose>true</verbose>
        </configuration>
      </plugin>
      <plugin>
        <artifactId>maven-shade-plugin</artifactId>
        <version>${maven-shade-plugin.version}</version>
        <executions>
          <execution>
            <phase>package</phase>
            <goals>
              <goal>shade</goal>
            </goals>
            <configuration>
              <transformers>
                <transformer
                  implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                  <manifestEntries>
                    <Main-Class>${launcher.class}</Main-Class>
                    <Main-Verticle>${main.verticle}</Main-Verticle>
                  </manifestEntries>
                </transformer>
                <transformer implementation="org.apache.maven.plugins.shade.resource.ServicesResourceTransformer"/>
              </transformers>
              <outputFile>${project.build.directory}/${project.artifactId}-${project.version}-fat.jar
              </outputFile>
            </configuration>
          </execution>
        </executions>
      </plugin>
      <plugin>
        <artifactId>maven-surefire-plugin</artifactId>
        <version>${maven-surefire-plugin.version}</version>
      </plugin>
      <plugin>
        <groupId>org.codehaus.mojo</groupId>
        <artifactId>exec-maven-plugin</artifactId>
        <version>${exec-maven-plugin.version}</version>
        <configuration>
          <mainClass>io.vertx.core.Launcher</mainClass>
          <arguments>
            <argument>run</argument>
            <argument>${main.verticle}</argument>
          </arguments>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
```

### MainVerticle.java
The application listens on port 8080 and returns HTML text.
```java
ansible@fedora-prd-rnd:~/DO288-apps/apps/pipelines-review/vertx-site$ cat src/main/java/com/redhat/vertx_site/MainVerticle.java 
package com.redhat.vertx_site;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServer;
import io.vertx.core.http.HttpServerResponse;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;

public class MainVerticle extends AbstractVerticle {

    @Override
    public void start() {
        // Create an HTTP server
        HttpServer server = vertx.createHttpServer();

        // Create a router to handle the HTTP requests
        Router router = Router.router(vertx);

        // Define the route for the root path
        router.get("/").handler(this::handleRoot);

        // Start the server and listen on port 8080
        server.requestHandler(router).listen(8080);
    }

    private void handleRoot(RoutingContext routingContext) {
        HttpServerResponse response = routingContext.response();

        // Set the content type header
        response.putHeader("Content-Type", "text/html");

        // Send HTML content as the response
        response.end("<html><body><h1>Welcome to your Vert.x v1.0 application!</h1></body></html>");
    }

    public static void main(String[] args) {
        Vertx vertx = Vertx.vertx();
        vertx.deployVerticle(new MainVerticle());
    }
}
```


## Tasks & Solution:: 
```bash
# 1. Log in to OpenShift as the developer user.
oc login -u developer -p developer https://api.ocp4.example.com:6443

# 2. Ensure that you use the builds-applications project.
oc project builds-applications

# 3. Create an application build.
oc new-app --name vertx-site \
--build-env MAVEN_MIRROR_URL=http://nexus-infra.apps.ocp4.example.com/java \
--env JAVA_APP_JAR=vertx-site-1.0.0-SNAPSHOT-fat.jar \
-i redhat-openjdk18-openshift:1.8 \
--context-dir apps/builds-applications/vertx-site \
https://git.ocp4.example.com/developer/DO288-apps

# 4. See the build logs.
oc logs -f buildconfig/vertx-site # The build failed because it could not download application dependencies.

[student@workstation vertx-site]$ oc logs -f buildconfig/vertx-site
Adding cluster TLS certificate authority to trust store
Cloning "https://git.ocp4.example.com/developer/DO288-apps" ...
...output omitted...
[INFO] Downloading from mirror.default: http://nexus-infra.apps.ocp4.example.com/java/io/vertx/vertx-stack-depchain/4.4.4/vertx-stack-depchain-4.4.4.pom
[ERROR] [ERROR] Some problems were encountered while processing the POMs:
[ERROR] Non-resolvable import POM: Could not find artifact io.vertx:vertx-stack-depchain:pom:4.4.4 in mirror.default (http://nexus-infra.apps.ocp4.example.com/java) @ line 28, column 19
...output omitted...

# 5. See the build status.
oc get build

NAME           TYPE     FROM          STATUS ...
vertx-site-1   Source   Git@8e8b86d   Failed (GenericBuildFailed) ...

# 6. Verify the correct classroom Maven repository URL.
cat ~/.m2/settings.xml

...output omitted...
<url>http://nexus-infra.apps.ocp4.example.com/repository/java</url>
...output omitted...
# The build environment variable is missing the /repository/ part of the Maven repository URL. Step 3, build-env...

# 7. Remediate the application build by using the correct value for MAVEN_MIRROR_URL build variable.
oc set env bc/vertx-site MAVEN_MIRROR_URL=http://nexus-infra.apps.ocp4.example.com/repository/java

# 8. Start a new build.
oc start-build vertx-site

# 9. Wait for the build to complete.
oc wait --for=condition=complete --timeout=600s builds/vertx-site-2

# 10. Verify that the application is accessible:
oc get pods

# 11. Expose the application by creating a route. Verify that the application is accessible:
oc expose svc vertx-site
curl vertx-site-builds-applications.apps.ocp4.example.com; echo
```

## Notes
For Maven applications, ~/.m2/settings.xml is the user-level Maven configuration file. 

It does not describe the application itself; pom.xml does that. settings.xml controls how Maven behaves when resolving dependencies, plugins, repositories, credentials, proxies, mirrors, and profiles.

Maven also uses a dir, ~/.m2/repository/ as the local dependency cache. 

So these are different,
```bash
~/.m2/settings.xml   = Maven configuration
~/.m2/repository/    = downloaded JARs/plugins/dependencies
```

Common settings.xml,
```bash
<settings>
  <mirrors>
    <mirror>
      <id>company-mirror</id>
      <mirrorOf>*</mirrorOf>
      <url>https://repo.example.com/maven-public</url>
    </mirror>
  </mirrors>
</settings>
```