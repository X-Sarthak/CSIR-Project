import { useEffect, useRef, useState } from "react";
import Spinner from "../Utility/Spinner.Utility";

interface EditPasswordFormProps {
  onUpdatePassword: (newPassword: string) => void;
  onCancel: () => void;
}

function EditPasswordForm({
  onUpdatePassword,
  onCancel,
}: EditPasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [oncancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdatePassword(newPassword);
      setNewPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-75">
      {loading && <Spinner />}
      <div ref={formRef} className="bg-white p-6 rounded-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Edit Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="text-right">
            <button
              type="button"
              className="text-gray-600 mr-4"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Update
            </button>{" "}
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPasswordForm;
