#include <iostream>
#include <string>
#include <vector>
#include <cstdlib>

using namespace std;

struct person
{
	string name;
	string address;
	string city;
	string state;
	string zip;
};

struct twoAddress
{
	string send;
	string reci;
};

class Package
{
protected:
	struct person sender;
	struct person recipient;
	double weight;
	double cost_per_ounce;

public:
	Package(struct person send, struct person reci, double weight, double c_p_o)
	{
		sender = send;
		recipient = reci;
		if (weight > 0)
			this->weight = weight;
		if (c_p_o > 0)
			cost_per_ounce = c_p_o;
	}

	virtual double calculateCost()
	{
		return weight * cost_per_ounce;
	}

	twoAddress getAddress()
	{
		struct twoAddress res = { sender.address, recipient.address };
		return res;
	}

};

class TwoDayPackage : public Package
{
private:
	double flatFee;

public:
	TwoDayPackage(struct person send, struct person reci, double weight, double c_p_o, double flatFee)
		:Package(send, reci, weight, c_p_o), flatFee(flatFee)
	{}

	double calculateCost()
	{
		return Package::calculateCost() + flatFee;
	}

};

class OvernightPackage : public Package
{
private:
	double add_per_ounce;

public:
	OvernightPackage(struct person send, struct person reci, double weight, double c_p_o, double add_per_ounce)
		:Package(send, reci, weight, c_p_o)
	{
		this->add_per_ounce = add_per_ounce;
	}

	double calculateCost()
	{
		return Package::calculateCost() + add_per_ounce * weight;
	}
};

int main()
{
	struct person mans[3] = 
	{ "Zhang San", "Southeast University", "Nanjing", "China", "211100",
	  "Li Si", "Tsinghua University", "Beijing", "China", "100000",
	  "Wang Wu", "Quanjude Roast Duck", "Beijing", "China", "100000"	};

	vector<Package*> packs;
	Package* p1 = new Package(mans[1], mans[2], 100, 5);
	Package* p2 = new TwoDayPackage(mans[0], mans[2], 20, 4, 10);
	Package* p3 = new OvernightPackage(mans[1], mans[0], 50, 6, 2);
	packs.push_back(p1);
	packs.push_back(p2);
	packs.push_back(p3);

	struct twoAddress pair;
	double tot = 0;
	for (auto i = packs.begin(); i != packs.end(); i++)
	{
		pair = (*i)->getAddress();
		cout << "FROM: " << pair.send << endl << "TO: " << pair.reci << endl;
		cout << "COST: " << (*i)->calculateCost() << endl << endl;
		tot += (*i)->calculateCost();
	}
	cout << "===========================" << endl << "           TOTAL COST: " << tot << endl;

	system("pause");
	return 0;
}