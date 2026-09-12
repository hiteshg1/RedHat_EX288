# Question 7 — Deploy from an OpenShift template

**Objective:** Deploy applications, work with builds, and troubleshoot resource configuration.  
**Difficulty:** Moderate. **Relevance:** High for deployment/build skills; template-specific mechanics are supporting knowledge rather than a promise of an exam task.  
**Estimated time:** 15–20 minutes for the exercise; 20–35 minutes for preparation. These estimates include builds and checks, assuming CRC is running.

Reviewed inputs: the latest supplied `question7.md` and `solution.md`.

## Original answer review

**Verdict: Partially correct.**

- The answer mixes three template names and invokes a name different from the supplied Template. Its deployment command also omits `APPLICATION_DOMAIN`, which its proposed template marks mandatory. Keep `ex288-php-mysql` and supply the hostname explicitly.
- The question requires necessary values, not every parameter to have `required: true`. Keep `CONTEXT_DIR` empty for repository-root source. `metadata.labels` labels the Template; top-level `labels` labels generated objects. Remove unnecessary delete/recreate steps and obsolete `oc export`.
- Replace the conflicting materials-server addresses and original Git/Route domains with the documented CRC values. Do not assume `openshift/php:7.4-ubi8` exists. Preparation supplies a local PHP 8.2 builder tag. The template has five application resources and no MySQL/PVC despite its catalog title; no database is needed for this PHP source.

## Environment choices

Use project `indy`, template `ex288-php-mysql`, application `php-app`, repository `https://gitlab.com/hits.govind/php-greeting-app.git` on `main`, and host `php-app-indy.apps-crc.testing`. Keep the original PHP code, two replicas, and five template objects.

The Deployment's internal image path explicitly names `indy`, matching this task. It has no image-change annotation; the initial deployment can pull the first published image, but automatic rollout after later rebuilds is not established. Adding that feature is outside this question's requirements.

## Validation evidence

**Documentation-reviewed:** OpenShift 4.18 templates, parameters, labels, and console workflow; published EX288 objectives; official builder image references. **Locally checked:** shell syntax, template processing, generated selectors/parameters, and document links. Local processing uses the available 4.10 client and is not a 4.18 server validation. **Not live-tested:** no Git pushes, cluster changes, image pulls, or builds performed. Repository and image access remain setup checks. Use a 4.18 client for practice.

## Practice order

[Environment](environment.md) → [Question](question.md) → [Answer](answer.md) → [Command reference](command-reference.md) and [Theory](theory-summary.md).

## Sources

- [OpenShift 4.18: Templates and console creation](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/building_applications/creating-applications)
- [OpenShift 4.18: Template API](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html-single/template_apis/index)
- [Official PHP builder image definitions](https://github.com/sclorg/s2i-php-container/blob/master/imagestreams/php-centos.json)
- [Published EX288 objectives](https://www.redhat.com/en/services/training/ex288-red-hat-certified-openshift-application-developer-exam)
