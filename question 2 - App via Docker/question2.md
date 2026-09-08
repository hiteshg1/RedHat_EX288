# Question 2 — Build and expose a Docker application

## Task

The Git repository at <https://gitlab.com/hits.govind/container-build.git> contains a Dockerfile.

1. Create an OpenShift project named `container-build`.
2. Build the application from the `main` branch using the Docker build strategy.
3. Name the application `q2-web`.
4. Expose the application and verify that it is reachable with `curl`.
5. Optimise the Dockerfile so that the resulting image is smaller than 256 MB.
6. If the application pod fails or enters `CrashLoopBackOff`, diagnose it, correct the repository, and redeploy a clean application.

### Environment

| Setting | Value |
|---|---|
| Project | `container-build` |
| Application name | `q2-web` |
| Build strategy | Docker |
| Repository | `https://gitlab.com/hits.govind/container-build.git` |
| Branch | `main` |

---