pipeline {
  agent any


  stages {
    stage('Checkout Code') {
      steps {
        git credentialsId: 'github-credentials', url: 'https://github.com/your/repo.git'
      }
    }

    stage('Build & Push Images with Ansible') {
      steps {
        dir('task-manager-ansible') {
          sh 'ansible-playbook -i inventory playbook.yml'
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
