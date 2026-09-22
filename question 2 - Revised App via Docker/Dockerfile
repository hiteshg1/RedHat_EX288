FROM registry.access.redhat.com/ubi9/ubi-minimal:latest

LABEL version="1.0"
LABEL description="This is Dockerfile"
LABEL maintainer="Red Hat Training <training@redhat.com>""

USER root

RUN microdnf install -y python3
RUN microdnf clean all
RUN mkdir -p /app
RUN echo "Hello container!" > /app/index.html

ENV DOCROOT=/app

EXPOSE 80

USER 1001

WORKDIR /app

CMD ["python3", "-m", "http.server", "80"]