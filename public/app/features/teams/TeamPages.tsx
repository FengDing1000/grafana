import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { hot } from 'react-hot-loader';
import config from 'app/core/config';
import PageHeader from 'app/core/components/PageHeader/PageHeader';
import TeamMembers from './TeamMembers';
import TeamSettings from './TeamSettings';
import TeamGroupSync from './TeamGroupSync';
import TeamPreferences from './TeamPreferences';
import { NavModel, Team, OrganizationPreferences } from 'app/types';
import { loadTeam, loadTeamPreferences } from './state/actions';
import { getTeam } from './state/selectors';
import { getTeamLoadingNav } from './state/navModel';
import { getNavModel } from 'app/core/selectors/navModel';
import { getRouteParamsId, getRouteParamsPage } from '../../core/selectors/location';
import { loadStarredDashboards } from '../../core/actions/user';

export interface Props {
  team: Team;
  loadTeam: typeof loadTeam;
  teamId: number;
  pageName: string;
  navModel: NavModel;
  preferences: OrganizationPreferences;
  loadStarredDashboards: typeof loadStarredDashboards;
  loadTeamPreferences: typeof loadTeamPreferences;
}

interface State {
  isSyncEnabled: boolean;
}

enum PageTypes {
  Members = 'members',
  Settings = 'settings',
  GroupSync = 'groupsync',
}

export class TeamPages extends PureComponent<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      isSyncEnabled: config.buildInfo.isEnterprise,
    };
  }

  async componentDidMount() {
    await this.props.loadStarredDashboards();
    await this.fetchTeam();
    await this.props.loadTeamPreferences();
  }

  async fetchTeam() {
    const { loadTeam, teamId } = this.props;

    return await loadTeam(teamId);
  }

  getCurrentPage() {
    const pages = ['members', 'settings', 'groupsync'];
    const currentPage = this.props.pageName;
    return _.includes(pages, currentPage) ? currentPage : pages[0];
  }

  renderPage() {
    const { isSyncEnabled } = this.state;
    const currentPage = this.getCurrentPage();

    switch (currentPage) {
      case PageTypes.Members:
        return <TeamMembers syncEnabled={isSyncEnabled} />;

      case PageTypes.Settings:
        return (
          <div>
            <TeamSettings />
            <TeamPreferences />
          </div>
        );

      case PageTypes.GroupSync:
        return isSyncEnabled && <TeamGroupSync />;
    }

    return null;
  }

  render() {
    const { team, navModel } = this.props;

    return (
      <div>
        <PageHeader model={navModel} />
        {team && Object.keys(team).length !== 0 && <div className="page-container page-body">{this.renderPage()}</div>}
      </div>
    );
  }
}

function mapStateToProps(state) {
  const teamId = getRouteParamsId(state.location);
  const pageName = getRouteParamsPage(state.location) || 'members';
  const teamLoadingNav = getTeamLoadingNav(pageName);

  return {
    navModel: getNavModel(state.navIndex, `team-${pageName}-${teamId}`, teamLoadingNav),
    teamId: teamId,
    pageName: pageName,
    team: getTeam(state.team, teamId),
    preferences: state.preferences,
  };
}

const mapDispatchToProps = {
  loadTeam,
  loadStarredDashboards,
  loadTeamPreferences,
};

export default hot(module)(connect(mapStateToProps, mapDispatchToProps)(TeamPages));
