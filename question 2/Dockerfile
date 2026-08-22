FROM registry.access.redhat.com/ubi9/ubi-minimal:latest

LABEL version="1.0" \
      description="Question 2 Python web container" \
      maintainer="Hitesh Govind"

USER root

RUN microdnf install -y python3 && \
    microdnf clean all && \
    mkdir -p /app && \
    echo "Hello container!" > /app/index.html

WORKDIR /app

EXPOSE 80

CMD ["python3", "-m", "http.server", "80"]