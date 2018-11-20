import React from 'react';
import { Icon, Spin } from 'antd';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Flex from '../shared/Flex';
import Analytics from './components/Analytics';
import { getAppAnalytics } from '../../modules/actions';
import { getAppAnalyticsByName } from '../../modules/selectors';
import RequestLogs from './components/RequestLogs';

let prevProps = {};
class Main extends React.Component {
	state = {
		isLoading: true,
	};

	static getDerivedStateFromProps(props) {
		if (prevProps.isFetching && !props.isFetching) {
			prevProps = props;
			return {
				isLoading: false,
			};
		}
		prevProps = props;
		return null;
	}

	componentDidMount() {
		// Comment out the below code to test paid user
		const { fetchAppAnalytics } = this.props;
		fetchAppAnalytics();
	}

	render() {
		const { isLoading } = this.state;
		const {
			noResults,
			popularSearches,
			searchVolume,
			popularResults,
			popularFilters,
			onClickViewAll,
		} = this.props;
		const { appName, chartWidth, plan } = this.props;
		if (isLoading) {
			const antIcon = (
				<Icon type="loading" style={{ fontSize: 50, marginTop: '250px' }} spin />
			);
			return (
				<Flex justifyContent="center" alignItems="center">
					<Spin indicator={antIcon} />
				</Flex>
			);
		}
		return (
			<React.Fragment>
				<Analytics
					noResults={noResults}
					chartWidth={chartWidth}
					plan={plan}
					popularSearches={popularSearches}
					popularFilters={popularFilters}
					popularResults={popularResults}
					searchVolume={searchVolume}
					onClickViewAll={onClickViewAll}
				/>
				<div css="margin-top: 20px">
					<RequestLogs appName={appName} />
				</div>
			</React.Fragment>
		);
	}
}
Main.defaultProps = {
	chartWidth: undefined,
	onClickViewAll: null,
};
Main.propTypes = {
	appName: PropTypes.string.isRequired,
	onClickViewAll: PropTypes.object,
	chartWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	plan: PropTypes.string.isRequired,
	fetchAppAnalytics: PropTypes.func.isRequired,
	popularSearches: PropTypes.array.isRequired,
	popularResults: PropTypes.array.isRequired,
	popularFilters: PropTypes.array.isRequired,
	searchVolume: PropTypes.array.isRequired,
	noResults: PropTypes.array.isRequired,
	isFetching: PropTypes.bool.isRequired, //eslint-disable-line
};
const mapStateToProps = (state) => {
	const analyticsArr = getAppAnalyticsByName(state) || [];
	let appAnalytics = {};
	analyticsArr.forEach((item) => {
		appAnalytics = {
			...appAnalytics,
			...item,
		};
	});
	return {
		plan: 'growth',
		appName: get(state, '$getCurrentApp.name'),
		popularSearches: get(appAnalytics, 'popular_searches', []),
		popularResults: get(appAnalytics, 'popular_results', []),
		popularFilters: get(appAnalytics, 'popular_filters', []),
		searchVolume: get(appAnalytics, 'search_volume', []),
		noResults: get(appAnalytics, 'no_results_searches', []),
		isFetching: get(state, '$getAppAnalytics.isFetching'),
	};
};
const mapDispatchToProps = dispatch => ({
	fetchAppAnalytics: (appName, plan) => dispatch(getAppAnalytics(appName, plan)),
});
export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(Main);
