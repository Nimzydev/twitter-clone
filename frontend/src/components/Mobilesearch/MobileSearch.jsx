import React, { useState } from "react";
import Rightpanel from "../Rightpanel/Rightpanel";
import { FaSearch } from "react-icons/fa";

function MobileSearch() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden w-full border-b border-gray-700 relative z-50">

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold text-white">Search</h1>

        <FaSearch
          className="text-xl cursor-pointer text-white"
          onClick={() => setOpen(!open)}
        />
      </div>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute top-full left-0 w-full bg-black border-t border-gray-700 max-h-[80vh] overflow-y-auto">
          <Rightpanel />
        </div>
      )}
    </div>
  );
}

export default MobileSearch;