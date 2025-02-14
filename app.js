
class Student {

    constructor(name, nationality, onRemoveMyself) {
        this.name = name
        this.nationality = nationality
        this.onRemoveMyself = onRemoveMyself
    }

    removeMyself() {
        this.onRemoveMyself(this.name)
    }

}

class Bootcamp {

    constructor(cohort) {
        this.cohort = cohort
        this.students = []
        this.handleRemoveStudent = this.handleRemoveStudent.bind(this)
    }

    addStudent(name, nationality) {
        const student = new Student(name, nationality, this.handleRemoveStudent)
        this.students.push(student)
    }

    handleRemoveStudent(name) {
        const studentIndex = this.students.findIndex((el) => el.name === name)
        this.students.splice(studentIndex, 1)
    }
}

const bootcamp = new Bootcamp('16')
bootcamp.addStudent('abeeb', 'nigerian')
bootcamp.addStudent('adam', 'british')
bootcamp.addStudent('ade', 'algerian')
bootcamp.addStudent('jones', 'american')

const abeeb = bootcamp.students[0]
abeeb.removeMyself()

console.log(bootcamp.students)
