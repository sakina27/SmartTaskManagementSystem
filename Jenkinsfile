pipeline {
  agent any


  stages {
    stage('Checkout Code') {
      steps {
        git branch: 'main', credentialsId: 'github-ssh-key', url: 'git@github.com:sakina27/SmartTaskManagementSystem.git'
      }
    }

    stage('Build & Push Images with Ansible') {
      steps {
        dir('task-manager-ansible') {
          withCredentials([string(credentialsId: 'ANSIBLE_VAULT_PASS', variable: 'VAULT_PASS')]) {
              sh 'echo "$VAULT_PASS" > vault_pass.txt'
              sh 'ansible-playbook -i inventory playbook.yml --vault-password-file vault_pass.txt --become'
          }

        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        sh 'kubectl apply -f task-manager-k8s/base/'
      }
    }
  }
}
