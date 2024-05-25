export function getUsers(){
  let session;
  let users;
  if (sessionStorage.getItem("userSession")){
    session = JSON.parse(sessionStorage.getItem("userSession"));
  }

  if (!localStorage.getItem("users")) {
    users["Dingsbums"]  = {
      name: "Dingsbums",
      total_score: 0,
      total_plays: 0,
      date : date,
      scores: [],
      lang: "de1",
      num_letters: 0
    };
    localStorage.setItem("users", JSON.stringify(users));
  }
  return {users: JSON.parse(localStorage.getItem("users")), session: session};
}