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
    }

     stage('Deploy to Kubernetes') {
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

      /* stage('Run Ansible Playbook') {
      steps {
        withCredentials([string(credentialsId: 'ANSIBLE_VAULT_PASS', variable: 'VAULT_PASS')]) {
          script {
            def ansibleDir = "/mnt/c/ProgramData/Jenkins/.jenkins/workspace/SmartTaskManagementSystem/task-manager-ansible"
            def winAnsibleDir = "C:\\ProgramData\\Jenkins\\.jenkins\\workspace\\SmartTaskManagementSystem\\task-manager-ansible"
            def wslWorkspace = "/mnt/c/ProgramData/Jenkins/.jenkins/workspace/SmartTaskManagementSystem"

            bat """
            @echo off
            echo Creating temporary vault_pass.sh script...

            echo #!/bin/sh > "%WORKSPACE%\\task-manager-ansible\\vault_pass.sh"
            echo echo %VAULT_PASS%>> "%WORKSPACE%\\task-manager-ansible\\vault_pass.sh"

            echo Setting script executable in WSL...
            C:\\Windows\\Sysnative\\wsl.exe chmod +x /mnt/c/ProgramData/Jenkins/.jenkins/workspace/SmartTaskManagementSystem/task-manager-ansible/vault_pass.sh

            echo Converting to Unix line endings...
            C:\\Windows\\Sysnative\\wsl.exe dos2unix /mnt/c/ProgramData/Jenkins/.jenkins/workspace/SmartTaskManagementSystem/task-manager-ansible/vault_pass.sh

            echo Running Ansible playbook...
            C:\\Windows\\Sysnative\\wsl.exe ansible-playbook -i /mnt/c/ProgramData/Jenkins/.jenkins/workspace/SmartTaskManagementSystem/task-manager-ansible/inventory /mnt/c/ProgramData/Jenkins/.jenkins/workspace/SmartTaskManagementSystem/task-manager-ansible/playbook.yml --vault-password-file /mnt/c/ProgramData/Jenkins/.jenkins/workspace/SmartTaskManagementSystem/task-manager-ansible/vault_pass.sh -e project_root=/mnt/c/ProgramData/Jenkins/.jenkins/workspace/SmartTaskManagementSystem --become

            echo Cleaning up...
            del "%WORKSPACE%\\task-manager-ansible\\vault_pass.sh"
            """

          }
        }
      }
    } */

    stage('Run Ansible Playbook') {
          steps {
            withCredentials([string(credentialsId: 'ANSIBLE_VAULT_PASS', variable: 'VAULT_PASSWORD')]) {
              ansiblePlaybook(
                playbook: 'task-manager-ansible/playbook.yml',
                inventory: 'task-manager-ansible/inventory',
                vaultCredentialsId: 'ANSIBLE_VAULT_PASS',  // Reference Jenkins credential directly
                extras: '-e project_root=${WORKSPACE} --become',
                installation: 'ansible'  // Matches the name from Step 2
              )
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

    stage('Elastic Search & Kibana') {
       steps {
          dir('docker-compose'){
             withKubeConfig([credentialsId: 'k8s-config']) {
                bat '''
                     docker-compose up -d
                 '''
             }
          }
       }
    }


    stage('Deploy filebeat') {
       steps {
          dir('docker-compose'){
          withKubeConfig([credentialsId: 'k8s-config']) {
             bat '''
                 kubectl apply -f filebeat-kubernetes.yaml
                 kubectl rollout restart daemonset filebeat -n kube-system
             '''
          }
          }
       }
    }
  }
}
