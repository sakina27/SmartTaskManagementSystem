pipeline {
  agent any

  stages {
    /* stage('Checkout Code') {
      steps {
        git branch: 'main', credentialsId: 'github-ssh-key', url: 'git@github.com:sakina27/SmartTaskManagementSystem.git'
      }
    } */

    stage('Checkout Code') {
       steps {
         git branch: 'main', credentialsId: 'Github', url: 'https://github.com/sakina27/SmartTaskManagementSystem.git'
       }
    }

    /* stage('Build & Push Images with Ansible') {
      steps {
        dir('task-manager-ansible') {
          withCredentials([string(credentialsId: 'ANSIBLE_VAULT_PASS', variable: 'VAULT_PASS')]) {
            sh '''
              echo "$VAULT_PASS" > vault_pass.txt
              ansible-playbook -i inventory playbook.yml --vault-password-file vault_pass.txt -e project_root=${WORKSPACE} --become
            '''
          }
        }
      }
    } */

    /* stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh 'kubectl apply -k task-manager-k8s/base/'
        }
      }
    }

    stage('Deploy ElasticSearch, kibana & logstash') {
      steps {
         withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
            sh 'kubectl apply -k elk-config'
         }
      }
    }

    stage('Deploy filebeats') {
      steps {
        dir('filebeats') {
          withCredentials([file(credentialsId: 'k8s-config', variable: 'KUBECONFIG')]) {
             sh '''
                  kubectl apply -f filebeat-configmap.yaml
                  kubectl apply -f filebeat-daemonset.yaml
                  kubectl apply -f filebeat-rbac.yaml
                '''
          }
        }
      }
    } */

    stage('Debug Environment') {
      steps {
        bat 'whoami && echo %PATH% && where wsl'
      }
    }


    stage('Run Ansible Playbook') {
      steps {
        script {
          def wslWorkspace = env.WORKSPACE
            .replaceAll('^[A-Za-z]:', '')     // Remove drive letter
            .replaceAll('\\\\', '/')          // Replace backslashes
            .replaceFirst('^/', '/mnt/c/')    // Prepend /mnt/c

          def ansibleDir = "${wslWorkspace}/task-manager-ansible"

          echo "WSL Ansible Dir: ${ansibleDir}"

          bat """
          C:\\Windows\\Sysnative\\wsl.exe ls ${ansibleDir}
          C:\\Windows\\Sysnative\\wsl.exe ansible-playbook -i ${ansibleDir}/inventory ${ansibleDir}/playbook.yml --vault-password-file ${ansibleDir}/vault_pass.txt -e project_root=${wslWorkspace} --become
          """
        }
      }
    }


    stage('Deploy to Kubernetes') {
       steps {
          withKubeConfig([credentialsId: 'k8s-config']) {
               bat '''
                  kubectl config view
                  kubectl cluster-info
                  kubectl get nodes
                  kubectl create namespace ingress-nginx
                  kubectl apply -k task-manager-k8s/base/
               '''
          }
       }
    }

    stage('Deploy ELK') {
       steps {
          withKubeConfig([credentialsId: 'k8s-config']) {
              bat '''
                 kubectl apply -k elk-config
              '''
          }
       }
    }

    stage('Deploy filebeat') {
       steps {
          dir('filebeat'){
          withKubeConfig([credentialsId: 'k8s-config']) {
             bat '''
                 kubectl apply -f filebeat-configmap.yaml
                 kubectl apply -f filebeat-daemonset.yaml
                 kubectl apply -f filebeat-rbac.yaml
             '''
          }
          }
       }
    }
  }
}
