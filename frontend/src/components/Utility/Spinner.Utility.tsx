import React from "react";
import "../Utility/Spinner.Utility.css"
const Spinner: React.FC = () => {
  return (
<div className="lds-roller absolute bottom-0 left-0 right-0 top-0 m-auto">
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  <div></div>
</div>

  );
};

export default Spinner;