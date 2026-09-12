# Question 5 — Post-commit build hook

**Objective:** Work with image builds and BuildConfigs; troubleshoot application builds.  
**Difficulty:** Moderate. **EX288 relevance:** High—aligned with published build objectives, not a claim about an actual exam question.  
**Estimated exercise time:** 8–12 minutes, including one build and verification.  
**Estimated setup time:** 20–30 minutes with CRC already running. Image pulls may extend both estimates.

## Review of the original answer

**Verdict: Partially correct.**

- The hook command is correct. The question's “after a build finishes” wording is revised: execution occurs after image assembly, before registry push and final completion. A failing hook fails the build.
- The supplied script can print “Email sent” even when the mail command fails. Verify script execution and Build status; email delivery is not required. Its build metadata and success text are not authoritative evidence of build completion.
- Starting a build does not identify the Python path. Invoking a readable script through Python does not require `chmod +x`; editing and committing source during the solution would violate the task.

## Lab adaptations

- Keep project `octane` and application `blog`.
- Use `https://gitlab.com/hits.govind/blog.git`, branch `main`.
- Use the generated CRC Route, expected as `blog-octane.apps-crc.testing`.
- Select the official Python 3.12 S2I builder explicitly. Preserve the supplied Flask application, dependency pins, and `mailer.py`; do not substitute a simulation.

The repository must be prepared as described below. Its existence, builder availability, and CRC connectivity have not been established. Use a fresh `octane` project for this lab to avoid changing existing work.

## Validation evidence

**Documentation-reviewed:** OpenShift 4.18 hook behaviour and syntax, published EX288 objectives, and the Python builder's startup settings. **Locally checked:** document links and shell-example syntax. **Not live-tested:** no cluster changes, builds, Git pushes, or mail execution were performed. The earlier local client check found `oc` 4.10.67; use a 4.18 client for this exercise.

## Practice order

1. [Prepare the environment](environment.md).
2. [Attempt the revised question](question.md).
3. [Check the revised answer](answer.md).
4. Review the [command reference](command-reference.md) and [theory summary](theory-summary.md).

## Sources

- [OpenShift 4.18: Build hooks and CLI syntax](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/builds_using_buildconfig/triggering-builds-build-hooks)
- [Red Hat: Published EX288 objectives](https://www.redhat.com/en/services/training/ex288-red-hat-certified-openshift-application-developer-exam)
- [Python S2I builder: Python 3.12 and application startup](https://github.com/sclorg/s2i-python-container/blob/master/3.12/README.md)
- [OpenShift 4.18: Deployment image triggers](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/images/triggering-updates-on-imagestream-changes)
