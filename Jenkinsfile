stage('Deploy ELK Stack') {
  steps {
    withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
      script {
        // Delete existing elasticsearch user secret to force Helm to use fixed password
        sh """
          echo "Deleting existing Elasticsearch user secret if it exists..."
          kubectl delete secret elasticsearch-es-elastic-user -n ${NAMESPACE} --kubeconfig \$KUBECONFIG || true
        """

        // Now install/upgrade elasticsearch with fixed password
        sh """
          helm upgrade --install elasticsearch elastic/elasticsearch \
            -n ${NAMESPACE} --create-namespace \
            -f elk-config/elasticsearch-values.yaml \
            --set elasticPassword=${elasticPassword} \
            --kubeconfig \$KUBECONFIG \
            --wait --timeout 5m
        """

        // The rest of your existing deploy steps...
        sh "kubectl rollout status statefulset/elasticsearch-master -n ${NAMESPACE} --kubeconfig \$KUBECONFIG"

        sh 'echo "Waiting 30 seconds for Elasticsearch to finish initializing..." && sleep 30'

        sh """
          for i in {1..30}; do
            STATUS=\$(curl -s -o /dev/null -w '%{http_code}' -u elastic:${elasticPassword} http://elasticsearch-master.${NAMESPACE}.svc.cluster.local:9200)
            if [ "\$STATUS" == "200" ]; then
              echo "Elasticsearch is ready!"
              break
            else
              echo "Elasticsearch not ready yet (status: \$STATUS). Waiting 10 seconds..."
              sleep 10
            fi
          done

          if [ "\$STATUS" != "200" ]; then
            echo "Elasticsearch did not become ready in time."
            exit 1
          fi
        """

        sh "kubectl delete pods -n ${NAMESPACE} -l job-name=pre-install-kibana-kibana --kubeconfig \$KUBECONFIG || true"

        sh """
          helm upgrade --install kibana elastic/kibana \
            -n ${NAMESPACE} \
            -f elk-config/kibana-values.yaml \
            --set elasticsearch.password=${elasticPassword} \
            --kubeconfig \$KUBECONFIG \
            --wait --timeout 5m --force
        """
      }
    }
  }
}
