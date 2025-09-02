import { PiKanbanFill } from "react-icons/pi";
import { MdSettings, MdSpaceDashboard } from "react-icons/md";
import { BsMicrosoftTeams } from "react-icons/bs";
import { FaProjectDiagram } from "react-icons/fa";

export const navMain = (language: string) => [
	{
		title: "Dashboard",
		url: "#",
		icon: MdSpaceDashboard,
	},
	{
		title: "Projects",
		url: `/${language}/projects`,
		icon: FaProjectDiagram,
	},
	{
		title: "Teams",
		url: `/${language}/teams`,
		icon: BsMicrosoftTeams,
	},
	{
		title: "Kanban",
		url: `/${language}/kanban`,
		icon: PiKanbanFill,
	},
	{
		title: "Settings",
		url: "#",
		icon: MdSettings,
	},
];
