var textBox = document.getElementById("textBox");

function submit() {
  var fireBaseRef = firebase.database().ref();
  fireBaseRef.child("userWords").set(textBox.value);
}
