import React, { Component } from 'react';
import {
	Row,
	Col,
	Form,
	Input,
	Switch,
	Button,
	Modal,
	Table,
	Menu,
	Icon,
	Dropdown,
} from 'antd';

import { DataSearch, MultiList, ReactiveList } from '@appbaseio/reactivesearch';

import dataSearchTypes from '../utils/datasearch-types';
import multiListTypes from '../utils/multilist-types';
import reactiveListTypes from '../utils/reactivelist-types';

import { deleteStyles, rowStyles, formWrapper, componentStyles } from '../styles';

const componentMap = {
	DataSearch,
	MultiList,
	ReactiveList,
};

const propsMap = {
	DataSearch: dataSearchTypes,
	MultiList: multiListTypes,
	ReactiveList: reactiveListTypes,
};

export default class RSWrapper extends Component {
	constructor(props) {
		super(props);

		this.state = {
			showModal: false,
			componentProps: props.componentProps,
			error: '',
		};

		if (!props.componentProps.dataField) {
			// set default dataField for the component if not defined
			const dataFields = this.getAvailableDataField();
			const { multiple } = propsMap[this.props.component].dataField;
			let otherProps = {};
			if (props.id === 'search') {
				otherProps = { fieldWeights: [2] };
			}
			props.onPropChange(props.id, {
				dataField: multiple ? [dataFields[0]] : dataFields[0],
				...otherProps,
			});
		}
	}

	componentWillReceiveProps(nextProps) {
		this.setState({
			componentProps: nextProps.componentProps,
		});
	}

	getAvailableDataField = () => {
		const { types } = propsMap[this.props.component].dataField;

		if (this.props.id === 'search') {
			return Object.keys(this.props.mappings)
				.filter(field => types.includes(this.props.mappings[field].type));
		}

		const fields = Object.keys(this.props.mappings)
			.filter((field) => {
				let fieldsToCheck = [
					this.props.mappings[field],
				];

				if (this.props.mappings[field].originalFields) {
					fieldsToCheck = [
						...fieldsToCheck,
						...Object.values(this.props.mappings[field].originalFields),
					];
				}

				return fieldsToCheck.some(item => types.includes(item.type));
			});

		return fields;
	};

	getSubFields = (field, types) => [
		...this.props.mappings[field].fields
			.filter(item => types.includes(this.props.mappings[field].originalFields[item].type))
			.map(item => `${field}.${item}`),
	];

	getSubFieldWeights = (field, defaultWeight = 1) => [
		...this.props.mappings[field].fields
			.map((item) => {
				let weight = 1;
				if (item === 'keyword') weight = defaultWeight;
				return parseInt(weight, 10);
			}),
	];

	setError = (error) => {
		this.setState({
			error,
		}, () => {
			setTimeout(() => {
				this.setState({
					error: '',
				});
			}, 3000);
		});
	}

	// generates the dataField prop for reactivesearch component
	// based on the selected-field(s)
	generateDataField = (selectedFields) => {
		const { types, multiple } = propsMap[this.props.component].dataField;
		if (multiple) {
			let resultFields = [];
			selectedFields.forEach((item) => {
				resultFields = [
					item,
					...resultFields,
					...this.getSubFields(item, types),
				];
			});
			return resultFields;
		}

		const validFields = this.getSubFields(selectedFields, types);
		return validFields ? validFields[0] : null;
	}

	generateFieldWeights = (selectedFields, weights) => {
		let resultWeights = [];
		selectedFields.forEach((item, index) => {
			resultWeights = [
				...resultWeights,
				parseInt(weights[index], 10),
				...this.getSubFieldWeights(item, weights[index]),
			];
		});

		return resultWeights;
	}

	resetComponentProps = () => {
		this.setState({
			componentProps: this.props.componentProps,
		});
	};

	showModal = () => {
		this.setState({
			showModal: true,
		});
	};

	handleOk = () => {
		this.props.onPropChange(this.props.id, this.state.componentProps);
		this.setState({
			showModal: false,
		});
	};

	handleCancel = () => {
		this.resetComponentProps();
		this.setState({
			showModal: false,
		});
	};

	handleDataFieldChange = (item) => {
		const dataField = item.key;

		this.setState({
			componentProps: {
				...this.state.componentProps,
				dataField,
			},
		});
	};

	handleSwitchPropChange = (name, value) => {
		this.setState({
			componentProps: {
				...this.state.componentProps,
				[name]: value,
			},
		});
	}

	handlePropChange = (e) => {
		const { name, value } = e.target;
		this.setState({
			componentProps: {
				...this.state.componentProps,
				[name]: value,
			},
		});
	};

	handleSearchDataFieldChange = (item) => {
		const field = item.key;
		const index = item.item.props.value;

		const dataField = Object.assign(
			[],
			this.state.componentProps.dataField,
			{ [index]: field },
		);
		this.setState({
			componentProps: {
				...this.state.componentProps,
				dataField,
			},
		});
	};

	handleSearchDataFieldDelete = (deleteIndex) => {
		this.setState({
			componentProps: {
				...this.state.componentProps,
				dataField: this.state.componentProps.dataField
					.filter((i, index) => index !== deleteIndex),
				fieldWeights: this.state.componentProps.fieldWeights
					.filter((i, index) => index !== deleteIndex),
			},
		});
	}

	handleSearchWeightChange = (index, value) => {
		const fieldWeights = Object.assign(
			[],
			this.state.componentProps.fieldWeights,
			{ [index]: value },
		);
		this.setState({
			componentProps: {
				...this.state.componentProps,
				fieldWeights,
			},
		});
	}

	handleAddFieldRow = () => {
		const field = this.getAvailableDataField()
			.find(item => !this.state.componentProps.dataField.includes(item));

		if (field) {
			this.setState({
				componentProps: {
					...this.state.componentProps,
					dataField: [...this.state.componentProps.dataField, field],
					fieldWeights: [...this.state.componentProps.fieldWeights, 2],
				},
			});
		}
	}

	renderDeleteButton = (x, y, index) => (
		<Button
			className={deleteStyles}
			icon="delete"
			shape="circle"
			type="danger"
			onClick={() => this.handleSearchDataFieldDelete(index)}
		/>
	);

	renderDataFieldTable = () => {
		const fields = this.getAvailableDataField();
		const columns = [
			{
				title: 'Field',
				dataIndex: 'field',
				key: 'field',
				render: (selected, x, index) => {
					const menu = (
						<Menu onClick={this.handleSearchDataFieldChange}>
							{
								fields
									.filter(item => (
										item === selected
										|| !this.state.componentProps.dataField.includes(item)
									))
									.map(item => (
										<Menu.Item key={item} value={index}>{item}</Menu.Item>
									))
							}
						</Menu>
					);
					return (
						<Dropdown overlay={menu}>
							<Button style={{ marginLeft: 8 }}>
								{selected} <Icon type="down" />
							</Button>
						</Dropdown>
					);
				},
			},
			{
				title: 'Weight',
				dataIndex: 'weight',
				key: 'weight',
				render: (value, x, index) => (
					<Input
						min={1}
						type="number"
						defaultValue={value}
						onChange={e => this.handleSearchWeightChange(index, e.target.value)}
					/>
				),
			},
			{
				render: this.renderDeleteButton,
			},
		];

		const dataSource = this.state.componentProps.dataField.map((field, index) => ({
			key: field,
			field,
			weight: this.state.componentProps.fieldWeights[index],
		}));

		return (
			<React.Fragment>
				<Table
					dataSource={dataSource}
					columns={columns}
					pagination={false}
					rowClassName={rowStyles}
				/>
				{
					fields.length === this.state.componentProps.dataField.length
						? null
						: (
							<div style={{ paddingTop: 12, textAlign: 'right' }}>
								<Button
									onClick={this.handleAddFieldRow}
									type="primary"
									style={{ marginBottom: 16 }}
								>
									Add a new field
								</Button>
							</div>
						)
				}
			</React.Fragment>
		);
	}

	renderFormItem = (item, name) => {
		let FormInput = null;
		const value = this.props.componentProps[name] !== undefined
			? this.props.componentProps[name]
			: item.default;

		switch (item.input) {
			case 'bool': {
				FormInput = (
					<Switch
						defaultChecked={value}
						onChange={val => this.handleSwitchPropChange(name, val)}
					/>
				);
				break;
			}
			case 'number': {
				FormInput = (
					<Input
						name={name}
						defaultValue={value}
						onChange={this.handlePropChange}
						type="number"
						placeholder={`Enter ${name} here`}
					/>
				);
				break;
			}
			default: {
				FormInput = (
					<Input
						name={name}
						defaultValue={value}
						onChange={this.handlePropChange}
						placeholder={`Enter ${name} here`}
					/>
				);
				break;
			}
		}

		return (
			<Form.Item
				label={item.label}
				colon={false}
				key={name}
			>
				<div
					style={{ margin: '0 0 6px' }}
					className="ant-form-extra"
				>
					{item.description}
				</div>
				{FormInput}
			</Form.Item>
		);
	}

	renderPropsForm = () => {
		const propNames = propsMap[this.props.component];
		const { dataField } = this.state.componentProps;
		const fields = this.getAvailableDataField();
		const menu = (
			<Menu onClick={this.handleDataFieldChange}>
				{
					fields.map(item => (
						<Menu.Item key={item}>{item}</Menu.Item>
					))
				}
			</Menu>
		);

		return (
			<Form onSubmit={this.handleSubmit} className={formWrapper}>
				<Form.Item
					label={propNames.dataField.label}
					colon={false}
				>
					<div
						style={{ margin: '0 0 6px' }}
						className="ant-form-extra"
					>
						{propNames.dataField.description}
					</div>
					{
						this.state.error
							? (
								<div
									style={{ color: 'tomato', margin: '0 0 6px' }}
									className="ant-form-extra"
								>
									{this.state.error}
								</div>
							)
							: null
					}
					{
						this.props.id === 'search'
							? this.renderDataFieldTable()
							: (
								<Dropdown overlay={menu}>
									<Button
										style={{
											width: '100%',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
										}}
									>
										{dataField} <Icon type="down" />
									</Button>
								</Dropdown>
							)
					}
				</Form.Item>
				{
					Object.keys(propNames)
					.filter(item => item !== 'dataField')
					.map(item => this.renderFormItem(propNames[item], item))
				}
			</Form>
		);
	}

	render() {
		if (!this.props.componentProps.dataField) return null;
		const RSComponent = componentMap[this.props.component];

		let btnStyle = {};
		if (this.props.full) {
			btnStyle = {
				width: '49%',
				marginTop: 10,
			};
		}

		let otherProps = {};
		if (this.props.id === 'search') {
			otherProps = {
				fieldWeights: this.generateFieldWeights(
					this.props.componentProps.dataField,
					this.props.componentProps.fieldWeights,
				),
			};
		}

		return (
			<div>
				<Row gutter={8}>
					<Col span={this.props.full ? 24 : 22}>
						<RSComponent
							componentId={this.props.id}
							{...this.props.componentProps}
							dataField={this.generateDataField(this.props.componentProps.dataField)}
							{...otherProps}
							className={componentStyles}
						/>
					</Col>
					<Col span={this.props.full ? 24 : 2}>
						<Button
							size="large"
							onClick={this.showModal}
							style={btnStyle}
						>
							Edit
						</Button>
						{
							this.props.full && this.props.showDelete
								? (
									<Button
										size="large"
										type="danger"
										onClick={() => this.props.onDelete(this.props.id)}
										style={{
											...btnStyle,
											marginLeft: '2%',
										}}
									>
										Delete
									</Button>
								)
								: null
						}
					</Col>
				</Row>

				<Modal
					title={`Edit ${this.props.component} Props`}
					visible={this.state.showModal}
					onOk={this.handleOk}
					onCancel={this.handleCancel}
					destroyOnClose
				>
					{this.renderPropsForm()}
				</Modal>
			</div>
		);
	}
}

RSWrapper.defaultProps = {
	showDelete: true,
};
