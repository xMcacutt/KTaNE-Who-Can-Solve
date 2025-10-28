import React, { createContext, useContext, useState, useEffect } from "react";

const ActiveUsersContext = createContext();

export function ActiveUsersProvider({ children }) {
  const [activeUsers, setActiveUsers] = useState(() => {
    const stored = localStorage.getItem("activeUsers");
    try {
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("activeUsers", JSON.stringify(activeUsers));
  }, [activeUsers]);

  const addUser = async (newUser) => {
    try {
      if (activeUsers.some((u) => u.id === newUser.id)) return;

      const res = await fetch(`/api/users/${newUser.id}/scores`);
      if (!res.ok) throw new Error(`Failed to fetch scores for ${newUser.id}`);
      let scores = await res.json();
      if (!Array.isArray(scores)) scores = [];

      setActiveUsers((prev) => [
        ...prev,
        { ...newUser, isDefuser: false, scores },
      ]);
    } catch (err) {
      console.error("Failed to add user:", err);
    }
  };

  const removeUser = (id) => {
    setActiveUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const setDefuser = (id) => {
    setActiveUsers((prev) =>
      prev.map((u) => ({ ...u, isDefuser: u.id === id }))
    );
  };

  return (
    <ActiveUsersContext.Provider
      value={{
        activeUsers,
        setActiveUsers,
        addUser,
        removeUser,
        setDefuser,
      }}
    >
      {children}
    </ActiveUsersContext.Provider>
  );
}

export function useActiveUsers() {
  return useContext(ActiveUsersContext);
}
