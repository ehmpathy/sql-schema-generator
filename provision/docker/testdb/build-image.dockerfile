FROM postgres:13

ADD wait-for-postgres.sh /root/
RUN chmod +x /root/wait-for-postgres.sh

# copy init scripts to docker-entrypoint-initdb.d for automatic execution
ADD init/*.sql /docker-entrypoint-initdb.d/
