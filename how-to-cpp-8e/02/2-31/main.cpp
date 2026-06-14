#include <iostream>
#include <cstdlib>

using namespace std;

int main()
{
	int dayDrivenMile,gallonCost,milesPerGallon,parkingFee,tollsFee;
	cout << "Please input the following info:" << endl;
	cout << "Total miles driven per day? ";
	cin >> dayDrivenMile;
	cout << "Cost per gallon of gasoline? ";
	cin >> gallonCost;
	cout << "Average miles per galloon? ";
	cin >> milesPerGallon;
	cout << "Parking fees per day? ";
	cin >> parkingFee;
	cout << "Tolls per day? ";
	cin >> tollsFee;

	int totalCost;
	totalCost = (dayDrivenMile / milesPerGallon) * gallonCost + parkingFee + tollsFee;
	
	cout << "Your cost per day of driving to work is " << totalCost << "." << endl;
	
	system("pause");

	return 0;
}