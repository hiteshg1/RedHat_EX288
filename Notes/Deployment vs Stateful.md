# Deployment vs Stateful Applications

## Postgresql POD with Deployment
```bash
 # Practice credentials: change before applying outside a disposable lab.
apiVersion: v1
kind: Secret
metadata:
  name: postgresql-deployment-secret
type: Opaque
stringData:
  POSTGRESQL_USER: practice
  POSTGRESQL_PASSWORD: PracticePass123
  POSTGRESQL_DATABASE: practicedb
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgresql-deployment-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  # Omitted storageClassName uses the cluster's default StorageClass.
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgresql-deployment
spec:
  replicas: 1
  # Stop the old database pod before starting its replacement on updates.
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: postgresql-deployment
  template:
    metadata:
      labels:
        app: postgresql-deployment
    spec:
      containers:
        - name: postgresql
          image: registry.redhat.io/rhel9/postgresql-16:latest
          ports:
            - name: postgresql
              containerPort: 5432
          envFrom:
            - secretRef:
                name: postgresql-deployment-secret
          readinessProbe:
            exec:
              command:
                - /bin/sh
                - -c
                - 'pg_isready -h 127.0.0.1 -p 5432 -U "$POSTGRESQL_USER" -d "$POSTGRESQL_DATABASE"'
            initialDelaySeconds: 10
            periodSeconds: 5
          volumeMounts:
            - name: data
              mountPath: /var/lib/pgsql/data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: postgresql-deployment-data
---
apiVersion: v1
kind: Service
metadata:
  name: postgresql-deployment
spec:
  type: ClusterIP
  selector:
    app: postgresql-deployment
  ports:
    - name: postgresql
      port: 5432
      targetPort: postgresql

 ```

## Postgresql POD with Stateful
```bash
# Practice credentials: change before applying outside a disposable lab.
apiVersion: v1
kind: Secret
metadata:
  name: postgresql-statefulset-secret
type: Opaque
stringData:
  POSTGRESQL_USER: practice
  POSTGRESQL_PASSWORD: PracticePass123
  POSTGRESQL_DATABASE: practicedb
---
apiVersion: v1
kind: Service
metadata:
  name: postgresql-headless
spec:
  clusterIP: None
  selector:
    app: postgresql-statefulset
  ports:
    - name: postgresql
      port: 5432
      targetPort: postgresql
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgresql-statefulset
spec:
  serviceName: postgresql-headless
  # Extra replicas would be independent databases, not PostgreSQL replication.
  replicas: 1
  selector:
    matchLabels:
      app: postgresql-statefulset
  template:
    metadata:
      labels:
        app: postgresql-statefulset
    spec:
      containers:
        - name: postgresql
          image: registry.redhat.io/rhel9/postgresql-16:latest
          ports:
            - name: postgresql
              containerPort: 5432
          envFrom:
            - secretRef:
                name: postgresql-statefulset-secret
          readinessProbe:
            exec:
              command:
                - /bin/sh
                - -c
                - 'pg_isready -h 127.0.0.1 -p 5432 -U "$POSTGRESQL_USER" -d "$POSTGRESQL_DATABASE"'
            initialDelaySeconds: 10
            periodSeconds: 5
          volumeMounts:
            - name: data
              mountPath: /var/lib/pgsql/data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 1Gi
        # Omitted storageClassName uses the cluster's default StorageClass.
```

### Deployment
- Pods are interchangeable
- Usually used for stateless workloads
- One manually configured PVC may be shared/referenced
- Pod names are not stable
- Good for web/API application replicas


### StatefulSet
- Pods have stable identities
- Designed for stateful workloads
- volumeClaimTemplates creates a PVC per replica
- Predictable names: app-0, app-1, app-2
- Useful for databases and clustered stateful services

### Comparison with scaling
#### PODS
```bash
ansible@fedora-prd-rnd:~$ oc get po
NAME                                    READY   STATUS    RESTARTS   AGE
postgresql-deployment-d9b785d45-9gnjv   1/1     Running   0          14m        # Deployment
postgresql-deployment-d9b785d45-kc254   1/1     Running   0          9m57s      # Deployment
postgresql-statefulset-0                1/1     Running   0          11m        # Stateful
postgresql-statefulset-1                1/1     Running   0          9m52s      # Stateful
```
#### PVC's
```bash
ansible@fedora-prd-rnd:~$ oc get pvc
NAME                            STATUS    VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS                   VOLUMEATTRIBUTESCLASS   AGE
data-postgresql-statefulset-0   Bound     pvc-7281718e-2a04-4749-b16c-ba1d9de79f65   79Gi       RWO            crc-csi-hostpath-provisioner   <unset>                 13m # Stateful
data-postgresql-statefulset-1   Bound     pvc-ca85c576-bd9d-494c-9c7c-1944894e6dea   79Gi       RWO            crc-csi-hostpath-provisioner   <unset>                 11m # Stateful
postgresql-deployment-data      Bound     pvc-36c05d70-0a76-4231-837a-fae025620faa   79Gi       RWO            crc-csi-hostpath-provisioner   <unset>                 15m # Deployment
```

