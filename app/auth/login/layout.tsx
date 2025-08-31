import React, { ReactNode } from "react";

const layout = ({ children }: { children: ReactNode }) => {
	return <React.Fragment>{children}</React.Fragment>;
};

export default layout;
