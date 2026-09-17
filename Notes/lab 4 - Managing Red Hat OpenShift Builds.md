# Managing Red Hat OpenShift Builds
## Outcomes
- Create, start, and rebuild application builds in Red Hat OpenShift.
- Debug and fix failed OpenShift builds.

## Instructions
Use the following as the input data for the required actions:

| Parameter                 | Value |
| ---	                    | --- |
| Apache Name	            | expense-service |
| Source code location	    | https://git.ocp4.example.com/developer/DO288-apps |
| Source code directory	    | apps/builds-review/expense-service |
| Build strategy            | Docker |
| API URL	                | http://expense-service-builds-review.apps.ocp4.example.com/expense |
| GitLab username           | developer |
| GitLab password           | d3v3lop3r |

Explore and build the expense-service application. 

You can explore the application locally in the ~/DO288/DO288-apps/apps/builds-review/expense-service directory. 

The application is in the apps/builds-review/expense-service directory in the repository.
```bash
# Use the following parameters for the build:
Application name: expense-service
Build strategy: docker
Source code: https://git.ocp4.example.com/developer/DO288-apps 
```

### Directory Structure
```bash
ansible@fedora-prd-rnd:~/DO288-apps/builds-review/apps/expense-service$ tree .
.
├── Dockerfile
├── Dockerfile.base
├── pom.xml
├── README.md
├── settings.xml
└── src
    └── main
        ├── docker
        │   ├── Dockerfile.fast-jar
        │   ├── Dockerfile.jvm
        │   └── Dockerfile.native
        ├── java
        │   └── com
        │       └── redhat
        │           └── training
        │               ├── Expense.java
        │               ├── ExpenseResource.java
        │               └── ExpenseService.java
        └── resources
            ├── application.properties
            └── META-INF
                └── resources
                    └── index.html
```

### Dockerfile
```
FROM registry.ocp4.example.com:8443/redhattraining/ocpdev-ubi8-openjdk-17-base:1.16

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src .
RUN mvn clean package

CMD ["java", "-jar", "target/expense-service-1.0.0-SNAPSHOT-runner.jar"]
```

## Tasks & Solution
```bash
# 1. Log in to OpenShift. Ensure that you use the builds-review project.
oc login -u developer -p developer https://api.ocp4.example.com:6443
oc project builds-review

# 2. Explore and build the expense-service application. You can explore the application locally in the ~/DO288/DO288-apps/apps/builds-review/expense-service directory. The application is in the apps/builds-review/expense-service directory in the repository.

# Use the following parameters for the build:
# Application name: expense-service
# Build strategy: docker
# Source code: https://git.ocp4.example.com/developer/DO288-apps 
cat Dockerfile

oc new-app --name expense-service --strategy Docker \
--context-dir apps/builds-review/expense-service \
https://git.ocp4.example.com/developer/DO288-apps

# 3. Follow the build logs to verify that the build finishes. Verify the application pods.
oc logs -f buildconfig/expense-service
oc get po

# 4. Find why the application is failing and fix the problem.
oc logs deploy/expense-service
Error: Unable to access jarfile target/expense-service-1.0.0-SNAPSHOT-runner.jar

# 5. Verify that the target/expense-service-1.0.0-SNAPSHOT-runner.jar file exists in the build output by building the application locally.
# run mvn -Dmaven.compiler.release=11 clean package on your workstation to verify there are no compilation errors and that the runner JAR builds successfully.
mvn -Dmaven.compiler.release=11 clean package 

# Optionally, you can verify that the file exists in the target directory.
ls target/*runner*
oc debug deploy/expense-service # Verify the state of the container file system.
ls target/                      # List the files in the target directory.

# 6. Correct the Dockerfile file. Open the Dockerfile file and modify the COPY src . instruction to create the src directory.
...output omitted...
RUN mvn dependency:go-offline

COPY src src
RUN mvn clean package

CMD ["java", "-jar", "target/expense-service-1.0.0-SNAPSHOT-runner.jar"]

# 7. Commit changes and push into the git repository.
git commit -am "fix: correct dockerfile"
git push

# 8. Redeploy the application.
oc start-build bc/expense-service --follow
oc get po

# 9. Expose the application for external requests and verify that the application works. Use the default expense-service-builds-review.apps.ocp4.example.com hostname for the application.
oc expose svc expense-service

curl -s expense-service-builds-review.apps.ocp4.example.com/expenses | jq
[
  {
    ...output omitted...
    "name": "Quarkus for Spring Developers",
    "paymentMethod": "DEBIT_CARD",
    "amount": 10.00
  }
...output omitted...
```

## Notes


### The main issue is the Dockerfile
```bash
FROM registry.ocp4.example.com:8443/redhattraining/ocpdev-ubi8-openjdk-17-base:1.16

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src .
RUN mvn clean package

CMD ["java", "-jar", "target/expense-service-1.0.0-SNAPSHOT-runner.jar"]
```
```bash
Repository                     COPY src .

src/                           Container
└── main/        ───────►      .
    ├── java/                  ├── main/
    └── resources/             │   ├── java/
                               │   └── resources/
                               └── pom.xml

Maven expects ./src/main/... ❌
```

#### Fix for Dockerfile
```bash
FROM registry.ocp4.example.com:8443/redhattraining/ocpdev-ubi8-openjdk-17-base:1.16

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src src
RUN mvn clean package

CMD ["java", "-jar", "target/expense-service-1.0.0-SNAPSHOT-runner.jar"]
```
```bash
Repository                     COPY src src

src/                           Container
└── main/        ───────►      .
    ├── java/                  ├── src/
    └── resources/             │   └── main/
                               │       ├── java/
                               │       └── resources/
                               └── pom.xml

Maven finds ./src/main/... ✅
```

### Key Concepts Breakdown
|  Concept |  Breakdown | 
|  ----- |  ------ | 
| Apache Maven (mvn): | Maven is the industry-standard build automation and dependency management tool for Java applications. It uses a pom.xml file to define project configurations, dependencies, and build plugins. |
| Dmaven.compiler.release=11: | This option tells the compiler to target the Java 11 platform APIs and output bytecode compatible with Java SE 11. This ensures consistency when running the application on OpenShift containers configured with a Java 11 runtime.| 
| clean package: | This combines two Maven lifecycle phases: clean deletes the target directory to ensure you are building from a fresh state without stale, older class files. package compiles your source code, runs unit tests, and bundles the compiled code into its distributable format (e.g., a JAR file).| 
| Uber JAR (Runner JAR): | A standard JAR file only contains your application's compiled code. An uber JAR (sometimes called a "fat JAR" or "runner JAR") packages your application code plus all of its runtime dependencies into a single, runnable file. This is highly beneficial for microservices (such as those built with Quarkus or Spring Boot) because the container image only needs to execute this single file.| 

The Maven command is a diagnostic step. It runs the Maven lifecycle through compilation, tests, resource processing, and packaging.
```bash
mvn -Dmaven.compiler.release=11 clean package
 │                │              │      │
 │                │              │      └─ build JAR
 │                │              └──────── remove old target/
 │                └─────────────────────── compile for Java 11
 └──────────────────────────────────────── run Maven
```