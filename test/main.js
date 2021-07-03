async function reply(interaction, response, flags, type = "SEND") {	
	if (!["EDIT_INITIAL", "DELETE_INTIAL", "FOLLOW_UP", "EDIT_SENT", "SEND"].includes(type)) { throw new Error(`${type} is not a valid response type`); }

	var data = (typeof response === 'object') ? await createAPIMessage(interaction, response) : { content: response }
	data.flags = flags;
	const followUpData = { data: data };

	switch(type) { // "EDIT_INITIAL", "DELETE_INTIAL", "FOLLOW_UP", "EDIT_SENT", "SEND"
		case "EDIT_INITIAL":
			client.api.webhooks(client.user.id, interaction.token).messages("@original").patch(followUpData);
			return;

		case "DELETE_INTIAL":
			client.api.webhooks(client.user.id, interaction.token).messages("@original").delete();
			return;

		case "FOLLOW_UP":
			client.api.webhooks(client.user.id, interaction.token).post(followUpData);
			return;

		case "EDIT_SENT":
			client.api.webhooks(client.user.id, interaction.token).messages(interaction.id).patch(followUpData);
			return;

		case "SEND":
			if (convertBitFieldToBits(flags).includes(7)) {
				data = { flags: flags };
				var responseType = 5;
			}
			else {
				var responseType = 4;
			}
			client.api.interactions(interaction.id, interaction.token).callback.post(
			{
				data: {
					type: responseType || 4,
					data
				}
			});
			return;

		default:
			throw new Error(`${type} is not a valid Interaction Response type`);
	}
}