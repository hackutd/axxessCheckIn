import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";

const NewEmail: NextPage = () => {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleInputChange = (newEmail) => {
    setEmail(newEmail.target.value);
  };

  const handleKeydown = (k) => {
    if (k.key == "Enter") {
      submit();
    }
  };

  const submit = async () => {
    try {
      const res = await fetch("/api/walkin", {
        mode: "cors",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
        }),
      });
      if (res.status !== 200) {
        alert(await res.text());
      } else {
        alert("Email added!");
      }
    } catch (err) {
      alert(err);
    }
    setEmail("");
  };

  return (
    <div className="flex flex-col items-center justify-center h-[100vh]">
      <h1 className="text-center text-3xl mb-4 text-red-300">Add a Walk-in</h1>
      <input
        type="text"
        className="text-2xl"
        value={email}
        onChange={handleInputChange}
        onKeyDown={handleKeydown}
      />
      <button
        className="bg-green-300 p-3 rounded-lg font-bold hover:bg-green-200 block mt-4"
        onClick={submit}
      >
        Submit
      </button>

      <button
        className="bg-orange-300 p-3 rounded-lg font-bold hover:bg-orange-200 block mt-4"
        onClick={() => {
          router.push("/");
        }}
      >
        back
      </button>
    </div>
  );
};

export default NewEmail;
