import React from 'react'
import ProjectPage from '@/components/pages/projects/project.page'
import TeamInvitesPage from '@/components/pages/team-invites/page'

const page = () => {
  return (
	<div className='w-full h-auto grid grid-cols-1'>
		<TeamInvitesPage />
	</div>
  )
}

export default page